import { describe, expect, test } from "bun:test"
import { shouldFlagForRecycle } from "../src/orchestrator"

// Covers the recycle-on-suspect policy: only `blocked` and `needs-js` outcomes
// should flag the pool for a browser recycle. Successful solves, transient
// errors, and timeouts must NOT trigger a recycle — otherwise warm cookies
// + cf_clearance get thrown away on every request.
describe("shouldFlagForRecycle", () => {
  test("flags blocked outcomes", () => {
    expect(shouldFlagForRecycle("blocked")).toBe(true)
  })

  test("flags needs-js outcomes", () => {
    expect(shouldFlagForRecycle("needs-js")).toBe(true)
  })

  test("does NOT flag success outcomes", () => {
    expect(shouldFlagForRecycle("success")).toBe(false)
  })

  test("does NOT flag transient errors", () => {
    expect(shouldFlagForRecycle("error")).toBe(false)
  })

  test("does NOT flag timeouts", () => {
    expect(shouldFlagForRecycle("timeout")).toBe(false)
  })

  test("does NOT flag skipped outcomes", () => {
    expect(shouldFlagForRecycle("skipped")).toBe(false)
  })
})
