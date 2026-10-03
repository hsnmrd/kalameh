import { describe, it, expect } from "vitest"
import { UpdateInstituteSchema } from "../src/institute/institute.schema"

describe("UpdateInstituteSchema dismissedHolidays preprocessing", () => {
  it("should accept a single string date from multipart/form-data and convert to array", () => {
    const result = UpdateInstituteSchema.safeParse({
      dismissedHolidays: "2026-11-15",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dismissedHolidays).toEqual(["2026-11-15"])
    }
  })

  it("should accept a standard array of date strings", () => {
    const result = UpdateInstituteSchema.safeParse({
      dismissedHolidays: ["2026-11-15", "2026-12-01"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dismissedHolidays).toEqual([
        "2026-11-15",
        "2026-12-01",
      ])
    }
  })

  it("should accept a JSON stringified array of date strings", () => {
    const result = UpdateInstituteSchema.safeParse({
      dismissedHolidays: '["2026-11-15", "2026-12-01"]',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dismissedHolidays).toEqual([
        "2026-11-15",
        "2026-12-01",
      ])
    }
  })

  it("should accept empty string and convert to empty array", () => {
    const result = UpdateInstituteSchema.safeParse({
      dismissedHolidays: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dismissedHolidays).toEqual([])
    }
  })
})
