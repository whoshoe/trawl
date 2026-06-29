import { BrowserPool, PoolExhaustedError, SessionCache } from "@trawl/browser"
import { scrape } from "@trawl/tiers"
import type { FlareSolverrRequest, FlareSolverrResponse, PoolStats, ScrapeRequest } from "@trawl/types"
import { Elysia } from "elysia"

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379"
const PORT = Number(process.env.PORT_API ?? "8191")
const POOL_SIZE = Number(process.env.BROWSER_POOL_SIZE ?? "2")
const SESSION_TTL = Number(process.env.SESSION_TTL_SECONDS ?? "3600")

// Single embedded pool — no BullMQ / worker process required.
// Redis is optional: without it, session caching (Tier 2 fast path) is disabled
// but scraping still works via Tier 1 / Tier 3.
let pool: BrowserPool | null = null
let sessionCache: SessionCache | null = null

async function initPool() {
  try {
    sessionCache = new SessionCache({
      redisUrl: REDIS_URL,
      ttlSeconds: SESSION_TTL,
    })
    console.log("[api] session cache connected  (Tier 2 fast-path enabled)")
  } catch (err) {
    console.warn("[api] session cache unavailable — Tier 2 disabled:", err instanceof Error ? err.message : err)
  }

  pool = new BrowserPool({ poolSize: POOL_SIZE })
  await pool.init()
  pool.startHealthCheck()
  console.log(`[api] ready — all ${POOL_SIZE} browser${POOL_SIZE === 1 ? "" : "s"} warm`)
}

function getDeps() {
  if (!pool) throw new Error("pool not ready")
  const p = pool
  const sc = sessionCache
  return {
    acquireBrowser: (d: string) => p.acquire(d),
    releaseBrowser: (id: number) => p.release(id),
    // Session cache ops are no-ops when Redis is unavailable
    loadSession: (d: string) => (sc ? sc.load(d).catch(() => null) : Promise.resolve(null)),
    saveSession: (d: string, data: unknown) => (sc ? sc.save(d, data as never).catch(() => {}) : Promise.resolve()),
    invalidateSession: (d: string) => (sc ? sc.invalidate(d).catch(() => {}) : Promise.resolve()),
  }
}

const startTime = Date.now()

// Concurrency limiter — gates in-flight scrape work at exactly POOL_SIZE so we
// reject immediately (HTTP 429) instead of letting BrowserPool.acquire() block
// for up to 5s. Prowlarr/Jackett use the 429 to back off cleanly.
let activeJobs = 0
const MAX_CONCURRENT = POOL_SIZE

function tryAcquireSlot(): boolean {
  if (activeJobs < MAX_CONCURRENT) {
    activeJobs++
    return true
  }
  return false
}

function releaseSlot(): void {
  if (activeJobs > 0) activeJobs--
}

// Build a FlareSolverr v2-shaped error envelope. Used by /v1, /scrape, and the
// second-line PoolExhaustedError catch-arm.
function flareSolverrError(url: string, message: string): FlareSolverrResponse {
  const now = Date.now()
  return {
    status: "error",
    message,
    startTimestamp: now,
    endTimestamp: now,
    version: "2.0.0",
    solution: { url, status: 0, headers: {}, response: "", cookies: [], userAgent: "" },
  }
}

new Elysia()
  .get("/health", () => ({
    status: pool ? "ok" : "starting",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    pool:
      pool?.getStats() ??
      ({
        total: 0,
        busy: 0,
        available: 0,
        restarts: 0,
        avgRestarts: 0,
      } satisfies PoolStats),
  }))

  .get("/stats", () => {
    const stats = pool?.getStats() ?? {
      total: 0,
      busy: 0,
      available: 0,
      restarts: 0,
      avgRestarts: 0,
    }
    return {
      browsers: stats.total,
      available: stats.available,
      busy: stats.busy,
      restarts: stats.restarts,
      queueDepth: 0,
      activeJobs,
      maxConcurrent: MAX_CONCURRENT,
    }
  })

  // FlareSolverr v2 compat — always open (Prowlarr/Jackett can't send auth headers)
  .post("/v1", async ({ body, set }) => {
    const req = body as FlareSolverrRequest
    const startTimestamp = Date.now()
    const cmd = req.cmd ?? "request.get"

    if (cmd !== "request.get" && cmd !== "request.post") {
      set.status = 400
      return flareSolverrError(req.url, `Unknown cmd: ${cmd}`)
    }

    if (!pool) {
      set.status = 503
      return flareSolverrError(req.url, "Browser pool initializing, retry in a few seconds")
    }

    if (!tryAcquireSlot()) {
      set.status = 429
      return flareSolverrError(req.url, "Browser pool saturated, retry shortly")
    }

    try {
      const result = await scrape({ url: req.url, maxTimeout: req.maxTimeout ?? 60_000, headers: req.headers }, getDeps())
      return {
        status: "ok",
        message: "",
        startTimestamp,
        endTimestamp: Date.now(),
        version: "2.0.0",
        solution: {
          url: result.url,
          status: result.statusCode,
          headers: {},
          response: result.html,
          cookies: result.cookies,
          userAgent: result.userAgent,
        },
      } satisfies FlareSolverrResponse
    } catch (err) {
      set.status = err instanceof PoolExhaustedError ? 429 : 500
      return flareSolverrError(req.url, err instanceof Error ? err.message : String(err))
    } finally {
      releaseSlot()
    }
  })

  // Native TRAWL API — richer response (tier, timings, sessionCached)
  .post("/scrape", async ({ body, set }) => {
    if (!pool) {
      set.status = 503
      return flareSolverrError("", "Browser pool initializing, retry in a few seconds")
    }

    const req = body as ScrapeRequest

    if (!tryAcquireSlot()) {
      set.status = 429
      return flareSolverrError(req.url ?? "", "Browser pool saturated, retry shortly")
    }

    try {
      return await scrape(req, getDeps())
    } catch (err) {
      set.status = err instanceof PoolExhaustedError ? 429 : 500
      return flareSolverrError(req.url ?? "", err instanceof Error ? err.message : String(err))
    } finally {
      releaseSlot()
    }
  })

  .listen(PORT)

console.log(`[api] TRAWL starting on :${PORT}  (pool: ${POOL_SIZE} browser${POOL_SIZE === 1 ? "" : "s"})`)
initPool().catch((err) => {
  console.error("[api] startup failed:", err)
  process.exit(1)
})

process.on("SIGTERM", async () => {
  await pool?.shutdown()
  process.exit(0)
})

process.on("SIGINT", async () => {
  await pool?.shutdown()
  process.exit(0)
})
