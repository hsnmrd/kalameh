import { describe, it, expect } from "vitest"
import { MicroApiError } from "micro-rq"
import { createQueryClient } from "../index"

describe("createQueryClient retry policy", () => {
  const queryClient = createQueryClient()
  const retryFn = queryClient.getDefaultOptions().queries?.retry as (
    failureCount: number,
    error: unknown
  ) => boolean

  it("never retries on 409 Conflict", () => {
    const error = new MicroApiError(
      new Response(null, { status: 409, statusText: "Conflict" }),
      { message: "ترمهای این فاز برای سال تحصیلی انتخابشده قبلاً ایجاد شدهاند" }
    )
    expect(error.status).toBe(409)
    expect(retryFn(0, error)).toBe(false)
    expect(retryFn(1, error)).toBe(false)
  })

  it("never retries on other 4xx client errors (400, 401, 403, 404, 422)", () => {
    const statusCodes = [400, 401, 403, 404, 422]
    for (const status of statusCodes) {
      const error = new MicroApiError(
        new Response(null, { status, statusText: "Client Error" }),
        {}
      )
      expect(error.status).toBe(status)
      expect(retryFn(0, error)).toBe(false)
    }
  })

  it("retries once on 5xx server errors", () => {
    const error = new MicroApiError(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
      {}
    )
    expect(error.status).toBe(500)
    expect(retryFn(0, error)).toBe(true)
    expect(retryFn(1, error)).toBe(false)
  })

  it("retries once on generic network errors without status code", () => {
    const networkError = new TypeError("Failed to fetch")
    expect(retryFn(0, networkError)).toBe(true)
    expect(retryFn(1, networkError)).toBe(false)
  })
})
