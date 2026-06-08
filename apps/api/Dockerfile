FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS builder

COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg unzip && rm -rf /var/lib/apt/lists/*

ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox

COPY package.json bun.lock* ./

# Bun requires every workspace package.json present during install
COPY packages/types/package.json   ./packages/types/
COPY packages/browser/package.json ./packages/browser/
COPY packages/tiers/package.json   ./packages/tiers/
COPY apps/api/package.json         ./apps/api/
COPY apps/web/package.json         ./apps/web/
COPY apps/docs/package.json        ./apps/docs/

RUN bun install --frozen-lockfile

# Separate layer — only re-runs when camoufox-js version changes, not on source edits
RUN bun x camoufox-js fetch

COPY packages/types/   ./packages/types/
COPY packages/browser/ ./packages/browser/
COPY packages/tiers/   ./packages/tiers/
COPY apps/api/         ./apps/api/

# Runtime — Ubuntu without the Playwright browser binaries (~3 GB saved)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 \
    libcairo2 libcairo-gobject2 \
    libdbus-1-3 libdbus-glib-1-2 \
    libfontconfig1 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 \
    libx11-6 libx11-xcb1 libxcb1 libxcb-shm0 \
    libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    libdrm2 libgbm1 \
    libasound2 \
    fonts-liberation \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=builder /opt/camoufox /opt/camoufox
COPY --from=builder /app /app

ENV CAMOUFOX_INSTALL_DIR=/opt/camoufox

WORKDIR /app

EXPOSE 8191

CMD ["bun", "run", "apps/api/src/index.ts"]
