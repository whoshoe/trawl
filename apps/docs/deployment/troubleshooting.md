---
title: Troubleshooting
description: Common issues and how to fix them.
---

# Troubleshooting

## API never becomes ready

**Symptom:** `docker compose logs api` shows browser launches but the API never prints `ready — all N browsers warm`.

**Causes:**

1. **Redis not reachable** — Check `REDIS_URL`. From inside Docker, use `redis://redis:6379` not `redis://localhost:6379`.
2. **Camoufox binary not installed** — The API Dockerfile runs `bunx camoufox-js fetch`. If this step was skipped (e.g. build cache reuse), rebuild: `docker compose build --no-cache api`.
3. **shm_size too small** — Ensure `shm_size: 1gb` is set on the API service.

## All requests return Tier 3 (never hitting cache)

**Symptom:** every request takes 10–30s, even for the same domain.

**Causes:**

1. **Redis session data is not persisting** — Run `docker exec trawl-redis redis-cli keys "session:*"` after a successful scrape. If empty, the session cache write is failing. Check API logs for Redis errors.
2. **`SESSION_TTL_SECONDS` set too low** — If it's shorter than Cloudflare's challenge interval, the cache expires before the next request.
3. **Domain key mismatch** — The key is the hostname only. `sub.example.com` and `www.example.com` are separate sessions.

## POST /v1 returns `status: "error"` with message `"timeout"`

**Symptom:** `maxTimeout` exceeded.

**Causes:**

1. **Cloudflare introduced a harder challenge** — Some sites use Turnstile or WAF rules that are harder to bypass. Check the API logs for the actual error.
2. **Pool exhausted** — All browsers are busy. Increase `BROWSER_POOL_SIZE`.
3. **Proxy not working** — If `PROXY_URL` is configured and invalid, Tier 3 will fail consistently. Test the proxy directly: `curl --proxy $PROXY_URL https://nowsecure.nl`.

## Prowlarr FlareSolverr test fails

**Symptom:** Green test in isolation but Prowlarr reports the FlareSolverr test as failed.

**Check:**
1. The URL in Prowlarr includes no trailing slash: `http://trawl:8191`
2. Prowlarr can reach the TRAWL container. If they're in different Docker networks, add TRAWL to Prowlarr's network (see [Prowlarr docs](/integrations/prowlarr)).
3. Run `docker exec prowlarr curl -s http://trawl:8191/health` to verify network reachability from inside the Prowlarr container.

## High memory usage / OOM kills

Each Camoufox instance uses 350–500 MB. With 3 browsers, expect ~1.5 GB total. If the API is being killed:

1. Reduce `BROWSER_POOL_SIZE` to 1 or 2
2. Upgrade the server (more RAM or more cores)
3. Ensure `shm_size: 1gb` is set — Firefox uses `/dev/shm` heavily

## Debugging tips

```bash
# Live API logs
docker compose logs -f api

# Check Redis keys
docker exec trawl-redis redis-cli keys "*"

# Test scrape endpoint
curl -s -X POST http://localhost:8191/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}' | jq '{tier, totalMs}'

# Verify FlareSolverr compat response shape
curl -s -X POST http://localhost:8191/v1 \
  -H "Content-Type: application/json" \
  -d '{"cmd":"request.get","url":"https://nowsecure.nl"}' | jq '{status, version}'
```
