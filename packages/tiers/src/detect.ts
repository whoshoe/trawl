export type ChallengeType =
  | "cloudflare-interstitial"
  | "cloudflare-turnstile"
  | "hcaptcha"
  | "recaptcha"
  | "cap"
  | "none"

export function isCloudflarePage(html: string, headers: Record<string, string>): boolean {
  if (headers["cf-mitigated"]) return true
  if (/<title>[^<]*(just a moment|ddos-guard|please wait|checking)[^<]*<\/title>/i.test(html)) return true
  if (/checking your browser/i.test(html)) return true
  if (/enable javascript and cookies to continue/i.test(html)) return true
  if (/verify you are human/i.test(html)) return true
  // id-based checks: specific to CF challenge DOM, not present in real pages
  if (/id="challenge-running"/i.test(html)) return true
  if (/id="cf-challenge-running"/i.test(html)) return true
  // CF Turnstile interstitial wrapper
  if (/id="turnstile-wrapper"/i.test(html)) return true
  // DDoS-Guard
  if (/ddos-guard\.net|\.ddos-guard\.net/i.test(html)) return true
  return false
}

export function hasTurnstile(html: string): boolean {
  return (
    /class="cf-turnstile"/i.test(html) ||
    /challenges\.cloudflare\.com\/turnstile/i.test(html) ||
    /cdn-cgi\/challenge-platform[^"']*turnstile/i.test(html)
  )
}

export function hasHcaptcha(html: string): boolean {
  return /class="h-captcha"|hcaptcha\.com\/1\/api/i.test(html)
}

export function hasRecaptcha(html: string): boolean {
  return /class="g-recaptcha"|google\.com\/recaptcha|recaptcha\.net\/recaptcha/i.test(html)
}

export function hasCapChallenge(html: string): boolean {
  return /cap-widget|trycap\.dev|data-cap-/i.test(html)
}

export function detectChallengeType(html: string, headers: Record<string, string> = {}): ChallengeType {
  if (hasTurnstile(html)) return "cloudflare-turnstile"
  if (isCloudflarePage(html, headers)) return "cloudflare-interstitial"
  if (hasHcaptcha(html)) return "hcaptcha"
  if (hasRecaptcha(html)) return "recaptcha"
  if (hasCapChallenge(html)) return "cap"
  return "none"
}

export function isBlocked(status: number, html: string): boolean {
  // 202 is used by some CDNs (e.g. IMDB) as a bot-gate before the real response
  if (status === 202 || status === 403 || status === 429) return true
  if (isCloudflarePage(html, {})) return true
  return false
}

export function needsJs(html: string, headers: Record<string, string>): boolean {
  return isCloudflarePage(html, headers)
}
