import { describe, expect, test } from "bun:test"
import { BrowserPool } from "../src/pool"

const waitFor = async (predicate: () => boolean) => {
  const deadline = Date.now() + 1000
  while (Date.now() < deadline) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error("timed out waiting for condition")
}

describe("BrowserPool recycling", () => {
  test("restarts the browser after the temporary context threshold", async () => {
    const browsers: Array<{ closed: boolean; isConnected: () => boolean; close: () => Promise<void> }> = []
    const contexts: Array<{ closed: boolean; pages: () => unknown[]; close: () => Promise<void> }> = []

    const pool = new BrowserPool({
      poolSize: 1,
      recycleAfterTemporaryContexts: 2,
      browserFactory: async () => {
        const browser = {
          closed: false,
          isConnected() {
            return !this.closed
          },
          async close() {
            this.closed = true
          },
        }
        const context = {
          closed: false,
          pages: () => [],
          async close() {
            this.closed = true
          },
        }
        browsers.push(browser)
        contexts.push(context)
        return { browser, context }
      },
    })

    await pool.init()

    const first = await pool.acquire("example.com")
    first.noteTemporaryContext?.("tier3 fresh context")
    pool.release(first.id)

    expect(pool.getStats().restarts).toBe(0)
    expect(pool.getStats().available).toBe(1)

    const second = await pool.acquire("example.com")
    second.noteTemporaryContext?.("tier3 fresh context")
    pool.release(second.id)

    await waitFor(() => pool.getStats().restarts === 1)

    expect(contexts[0].closed).toBe(true)
    expect(browsers[0].closed).toBe(true)
    expect(pool.getStats().available).toBe(1)
    expect(browsers).toHaveLength(2)
  })
})
