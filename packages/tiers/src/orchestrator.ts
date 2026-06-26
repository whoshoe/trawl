import type { BrowserHandle } from "@trawl/browser"
import { FINGERPRINT } from "@trawl/browser"
import type { Cookie, ScrapeRequest, ScrapeResult, SessionData, TierResult } from "@trawl/types"
import { normalizeHtml } from "./html"
import { runTier1 } from "./tier1"
import { runTier2 } from "./tier2"
import { runTier3 } from "./tier3"
import { runTier4 } from "./tier4"

export interface OrchestratorDeps {
  acquireBrowser(domain: string): Promise<BrowserHandle>
  releaseBrowser(id: number): void
  loadSession(domain: string): Promise<SessionData | null>
  saveSession(domain: string, data: SessionData): Promise<void>
  invalidateSession(domain: string): Promise<void>
  proxyUrl?: string
  residentialProxyUrl?: string
  onTierAttempt?: (result: TierResult) => void
}

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export async function scrape(req: ScrapeRequest, deps: OrchestratorDeps): Promise<ScrapeResult> {
  const totalStart = Date.now()
  const maxTimeout = req.maxTimeout ?? 60_000
  const maxTier = req.maxTier ?? 4
  const timings: TierResult[] = []
  const domain = extractDomain(req.url)

  const emit = (r: TierResult) => {
    timings.push(r)
    deps.onTierAttempt?.(r)
  }

  // Tier 1: plain HTTP fetch
  if (!req.skipHttp && maxTier >= 1) {
    const t1 = await runTier1(req.url, req.headers)
    emit(t1)
    if (t1.status === "success" && t1.html !== undefined) {
      return {
        url: req.url,
        html: normalizeHtml(t1.html),
        cookies: [],
        userAgent: FINGERPRINT.userAgent,
        statusCode: t1.statusCode ?? 200,
        tier: 1,
        sessionCached: false,
        timings,
        totalMs: Date.now() - totalStart,
      }
    }
  }

  if (maxTier < 2) {
    throw new Error("Max tier reached without success")
  }

  // Acquire browser for tiers 2-4
  const handle = await deps.acquireBrowser(domain)

  try {
    // Tier 2: browser with cached session
    const session = await deps.loadSession(domain)
    if (session && maxTier >= 2) {
      const remaining = maxTimeout - (Date.now() - totalStart)
      const t2 = await runTier2(req.url, handle, session, remaining, req.headers)
      emit(t2)
      if (t2.status === "success" && t2.html !== undefined) {
        if (t2.cookies && t2.cookies.length > 0) {
          await deps.saveSession(domain, {
            cookies: t2.cookies,
            userAgent: session.userAgent,
            savedAt: Date.now(),
          })
        }
        return {
          url: req.url,
          html: normalizeHtml(t2.html),
          cookies: t2.cookies ?? [],
          userAgent: session.userAgent,
          statusCode: t2.statusCode ?? 200,
          tier: 2,
          sessionCached: true,
          timings,
          totalMs: Date.now() - totalStart,
          captchasSolved: t2.captchasSolved,
        }
      }
      // Session failed — purge it
      await deps.invalidateSession(domain)
    }

    if (maxTier < 3) {
      throw new Error("Max tier reached without success")
    }

    // Tier 3: fresh challenge solve
    const remaining3 = maxTimeout - (Date.now() - totalStart)
    const t3 = await runTier3(req.url, handle, remaining3, deps.proxyUrl, req.headers)
    emit(t3)
    if (t3.status === "success" && t3.html !== undefined) {
      const cookies: Cookie[] = t3.cookies ?? []
      if (cookies.length > 0) {
        await deps.saveSession(domain, {
          cookies,
          userAgent: t3.userAgent ?? FINGERPRINT.userAgent,
          savedAt: Date.now(),
        })
      }
      return {
        url: req.url,
        html: normalizeHtml(t3.html),
        cookies,
        userAgent: t3.userAgent ?? FINGERPRINT.userAgent,
        statusCode: t3.statusCode ?? 200,
        tier: 3,
        sessionCached: false,
        timings,
        totalMs: Date.now() - totalStart,
        captchasSolved: t3.captchasSolved,
      }
    }

    if (maxTier < 4) {
      throw new Error("Max tier reached without success")
    }

    // Tier 4: residential proxy escalation — requires RESIDENTIAL_PROXY_URL to be set.
    const proxyUrl = deps.residentialProxyUrl
    if (!proxyUrl) {
      throw new Error(
        `Tier 3 failed (${t3.reason ?? t3.status}). Set RESIDENTIAL_PROXY_URL to enable Tier 4 proxy escalation.`,
      )
    }
    console.log(`[orchestrator] Tier 4 via residential proxy: ${proxyUrl.replace(/\/\/[^@]*@/, "//**@")}`)

    const remaining4 = maxTimeout - (Date.now() - totalStart)
    const t4 = await runTier4(req.url, handle, remaining4, proxyUrl, req.headers)
    emit(t4)
    if (t4.status === "success" && t4.html !== undefined) {
      const cookies: Cookie[] = t4.cookies ?? []
      if (cookies.length > 0) {
        await deps.saveSession(domain, {
          cookies,
          userAgent: t4.userAgent ?? FINGERPRINT.userAgent,
          savedAt: Date.now(),
        })
      }
      return {
        url: req.url,
        html: normalizeHtml(t4.html),
        cookies,
        userAgent: t4.userAgent ?? FINGERPRINT.userAgent,
        statusCode: t4.statusCode ?? 200,
        tier: 4,
        sessionCached: false,
        timings,
        totalMs: Date.now() - totalStart,
      }
    }

    throw new Error(`All tiers exhausted. Last failure: ${t4.reason ?? t4.status}`)
  } finally {
    deps.releaseBrowser(handle.id)
  }
}
