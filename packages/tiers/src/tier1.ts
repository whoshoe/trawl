import { FINGERPRINT } from "@trawl/browser"
import type { TierResult } from "@trawl/types"
import { isBlocked, isCloudflarePage } from "./detect"
import { normalizeHtml } from "./html"

export interface Tier1Result extends TierResult {
  tier: 1
  html?: string
  statusCode?: number
}

export async function runTier1(url: string): Promise<Tier1Result> {
  const start = Date.now()
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": FINGERPRINT.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      redirect: "follow",
    })

    const html = await res.text()
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => {
      headers[k] = v
    })

    if (isCloudflarePage(html, headers)) {
      return { tier: 1, status: "needs-js", durationMs: Date.now() - start, reason: "cloudflare-challenge" }
    }

    if (isBlocked(res.status, html)) {
      return { tier: 1, status: "blocked", durationMs: Date.now() - start, reason: `http-${res.status}` }
    }

    return {
      tier: 1,
      status: "success",
      durationMs: Date.now() - start,
      html: normalizeHtml(html),
      statusCode: res.status,
    }
  } catch (err) {
    return {
      tier: 1,
      status: "error",
      durationMs: Date.now() - start,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
