---
title: Configuration
description: All environment variables for TRAWL, with defaults and examples.
---

# Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and edit before starting.

## Redis

### `REDIS_URL`

**Default:** `redis://localhost:6379`

Standard Redis connection URL. When running inside Docker Compose use the service name:

```ini
REDIS_URL=redis://redis:6379
```

With authentication:

```ini
REDIS_URL=redis://:yourpassword@redis:6379
```

With a specific database index:

```ini
REDIS_URL=redis://redis:6379/1
```

## Browser Pool

### `BROWSER_POOL_SIZE`

**Default:** `3`

Number of Camoufox Firefox instances to keep warm. Each instance uses ~350–500 MB RAM under load. Start conservative and raise if you need higher concurrency.

```ini
BROWSER_POOL_SIZE=1   # minimal (1 GB host RAM)
BROWSER_POOL_SIZE=3   # default — good for most self-hosted setups
BROWSER_POOL_SIZE=8   # high-throughput (6+ GB host RAM)
```

> **Note:** The API container sets `shm_size: 1gb` by default. If you raise `BROWSER_POOL_SIZE` above 5, also raise `shm_size` in your `docker-compose.yml` to at least `2gb`.

### `BROWSER_ACQUIRE_TIMEOUT_MS`

**Default:** `15000` (15 seconds)

How long `BrowserPool.acquire()` will poll for a free browser before rejecting with `PoolExhaustedError`. With `BROWSER_POOL_SIZE=3` and a typical Cloudflare challenge taking 5–8s per request, the 15s default lets a full burst of 10 concurrent requests drain without any 429s.

Lower it for fail-fast client feedback (Prowlarr will see 429s sooner and retry on its own). Raise it for very heavy upstream targets or when you've bumped `BROWSER_POOL_SIZE` higher.

```ini
BROWSER_ACQUIRE_TIMEOUT_MS=5000    # fail fast — 429s after 5s
BROWSER_ACQUIRE_TIMEOUT_MS=15000   # default — absorbs a full burst on pool=3
BROWSER_ACQUIRE_TIMEOUT_MS=30000   # tolerate longer queueing on slow targets
```

When the timeout fires, both `/v1` and `/scrape` return **HTTP 429** with the FlareSolverr v2 error envelope (not a 500).

## Session Cache

### `SESSION_TTL_SECONDS`

**Default:** `3600` (1 hour)

How long Cloudflare cookies are cached in Redis per domain. After this TTL the next request to the domain triggers a fresh challenge solve (Tier 3) and refreshes the cache.

Cloudflare's `cf_clearance` cookie typically has a 30-minute expiry. Setting `SESSION_TTL_SECONDS` below 1800 wastes cache hits; setting it above 7200 risks replaying expired cookies (TRAWL handles this gracefully by invalidating the cache and falling back to Tier 3).

```ini
SESSION_TTL_SECONDS=3600   # default — safe for most sites
SESSION_TTL_SECONDS=1800   # more conservative
```

## Proxies

### `PROXY_URL`

**Default:** _(empty — no proxy)_

Datacenter proxy used for Tier 3 (fresh challenge solve). Format: `protocol://user:pass@host:port`.

```ini
PROXY_URL=http://user:pass@dc-proxy.example.com:8080
```

Leave empty to run Tier 3 without a proxy (your server's real IP is used).

### `RESIDENTIAL_PROXY_URL`

**Default:** _(empty — Tier 4 disabled)_

Residential proxy used for Tier 4 (when the datacenter IP is flagged). Same format as `PROXY_URL`. Tier 4 is completely skipped if this variable is not set.

```ini
RESIDENTIAL_PROXY_URL=http://user:pass@residential.example.com:8080
```

## Ports

### `PORT_API`

**Default:** `8191`

Port the Elysia API server listens on. Defaults to `8191` — the same port FlareSolverr and Byparr use, so you can swap TRAWL in without changing any *arr app settings.

### `PORT_WEB`

**Default:** `3000`

Port the Nuxt landing page listens on.

---

## Full `.env.example`

```ini
# ── Redis ─────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Browser pool ──────────────────────────────
BROWSER_POOL_SIZE=3
BROWSER_ACQUIRE_TIMEOUT_MS=15000
SESSION_TTL_SECONDS=3600

# ── Proxies (optional) ────────────────────────
PROXY_URL=
RESIDENTIAL_PROXY_URL=

# ── Ports ─────────────────────────────────────
PORT_API=8191
PORT_WEB=3000
```
