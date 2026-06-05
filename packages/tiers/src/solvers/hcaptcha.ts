// hCaptcha solver — browser-only, no external services.
//
// With a real Chrome fingerprint and a non-datacenter IP, hCaptcha's risk
// scoring sometimes auto-passes the checkbox without showing an image challenge.
// Success rate varies by site sitekey difficulty and IP reputation.
//
// There is no fully free, reliable way to solve hCaptcha image grids without
// an AI/ML model or a paid solving service. We attempt the checkbox and return
// whether it auto-passed.

import type { Page } from "patchright"

// hCaptcha widget iframe. newassets.hcaptcha.com is their CDN; don't filter by title
// since the title attribute may not be set yet or may vary across versions.
const WIDGET_FRAME = 'iframe[src*="hcaptcha.com"]'

export async function solveHcaptcha(page: Page, timeoutMs = 15_000): Promise<boolean> {
  try {
    const hasWidget = await page
      .waitForSelector(WIDGET_FRAME, { timeout: 8000, state: "attached" })
      .then(() => true)
      .catch(() => false)
    if (!hasWidget) return false

    // Pick the first hCaptcha iframe (may be multiple on demo pages with difficulty tabs)
    const widget = page.frameLocator(WIDGET_FRAME).first()

    // Click the checkbox — force:true handles widgets inside hidden tab containers
    await widget.locator("#checkbox").click({ timeout: 5000, force: true })
    console.log("[hcaptcha] clicked checkbox")

    await new Promise((r) => setTimeout(r, Math.min(timeoutMs - 1000, 3000)))

    const passed = await widget
      .locator('[aria-checked="true"]')
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    if (passed) {
      console.log("[hcaptcha] auto-passed ✓")
      return true
    }

    console.log("[hcaptcha] image challenge appeared — cannot solve without AI")
    return false
  } catch (err) {
    console.log("[hcaptcha] error:", err instanceof Error ? err.message : err)
    return false
  }
}

export async function hasHcaptchaWidget(page: Page, timeout = 2000): Promise<boolean> {
  return page
    .waitForSelector(WIDGET_FRAME, { timeout, state: "attached" })
    .then(() => true)
    .catch(() => false)
}
