---
title: Standalone Containers
description: Build and run each TRAWL service as an individual Docker container.
---

# Standalone Containers

Each service has its own Dockerfile and can be built and run independently.

## Scraper API

The API image is published to GHCR on every push to `main`. Pull it directly — no local build needed.

```bash
# Pull
docker pull ghcr.io/germondai/trawl:latest

# Run (no Redis — session caching disabled, scraping still works)
docker run -d \
  --name trawl \
  -p 8191:8191 \
  --shm-size=1gb \
  ghcr.io/germondai/trawl:latest

# Run (with external Redis)
docker run -d \
  --name trawl \
  -p 8191:8191 \
  --shm-size=1gb \
  -e REDIS_URL=redis://your-redis-host:6379 \
  -e BROWSER_POOL_SIZE=3 \
  ghcr.io/germondai/trawl:latest
```

To build from source instead:

```bash
# Run from the repo root
docker build -f apps/api/Dockerfile -t trawl .
docker run -d --name trawl -p 8191:8191 --shm-size=1gb trawl
```

::: warning Build context
The API Dockerfile requires the **repo root** as the build context because it copies workspace packages (`packages/types`, `packages/browser`, `packages/tiers`). Always run `docker build` from the repo root with `-f apps/api/Dockerfile`.
:::

::: tip Why pull instead of build?
Building the API image downloads the Camoufox Firefox binary (~660 MB) and compiles dependencies — takes 5–10 minutes on first run. The published image on GHCR skips all of that.
:::

## Web (landing page)

```bash
# Build — run from repo root
docker build -f apps/web/Dockerfile -t trawl-web .

# Run
docker run -d \
  --name trawl-web \
  -p 3000:80 \
  trawl-web
```

Static HTML served by nginx. No runtime dependencies.

## Docs

```bash
# Build — run from repo root
docker build -f apps/docs/Dockerfile -t trawl-docs .

# Run
docker run -d \
  --name trawl-docs \
  -p 3001:80 \
  trawl-docs
```

Access at `http://localhost:3001`. Static nginx, no runtime dependencies.

For subdomain deployment (e.g. `docs.yourdomain.com`), point the subdomain at port 3001 via your reverse proxy — no path configuration needed.

## Useful commands

```bash
# Check what's running
docker ps

# Tail logs
docker logs -f trawl

# Stop and remove
docker stop trawl && docker rm trawl

# Update the scraper to latest
docker pull ghcr.io/germondai/trawl:latest
docker stop trawl && docker rm trawl
docker run -d --name trawl -p 8191:8191 --shm-size=1gb ghcr.io/germondai/trawl:latest
```
