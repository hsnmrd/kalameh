import { describe, it, expect } from "vitest"
import { CreateInstituteCustomOffDaySchema } from "../src/institute/institute-off-day.schema"

describe("CreateInstituteCustomOffDaySchema", () => {
  it("should validate a single date payload", () => {
    const result = CreateInstituteCustomOffDaySchema.safeParse({
      date: "2026-05-10",
      title: "روز تعطیل تکی",
    })
    expect(result.success).toBe(true)
  })

  it("should validate a date range payload", () => {
    const result = CreateInstituteCustomOffDaySchema.safeParse({
      startDate: "2026-05-01",
      endDate: "2026-05-10",
      title: "تعطیلات ده روزه",
    })
    expect(result.success).toBe(true)
  })

  it("should fail when both date and startDate are missing", () => {
    const result = CreateInstituteCustomOffDaySchema.safeParse({
      title: "بدون تاریخ",
    })
    expect(result.success).toBe(false)
  })

  it("should fail when endDate is before startDate", () => {
    const result = CreateInstituteCustomOffDaySchema.safeParse({
      startDate: "2026-05-10",
      endDate: "2026-05-01",
      title: "بازه نامعتبر",
    })
    expect(result.success).toBe(false)
  })

  it("should allow single day range where startDate equals endDate", () => {
    const result = CreateInstituteCustomOffDaySchema.safeParse({
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      title: "بازه تک روزه",
    })
    expect(result.success).toBe(true)
  })
})
