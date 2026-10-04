import { describe, expect, it } from "vitest"
import type { TermDto, ClassDto } from "@workspace/types"
import {
  toIsoDate,
  normalizeIsoDate,
  isDateInTerm,
  getActiveTermsForDate,
  getClassesForDate,
  isDateInAnyTerm,
  isDateClassSession,
  getTermsRunningInMonth,
  formatDisplayDate,
} from "../calendar-schedule.helper"

describe("calendar-schedule.helper", () => {
  const mockTerm: TermDto = {
    id: "term-1",
    instituteId: "inst-1",
    title: "ترم پاییز",
    startDate: "2026-09-23T00:00:00.000Z",
    endDate: "2026-12-21T00:00:00.000Z",
    isActive: true,
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
  }

  const mockClass: ClassDto = {
    id: "class-1",
    instituteId: "inst-1",
    termId: "term-1",
    courseId: "course-1",
    title: "انگلیسی پیشرفته",
    capacity: 15,
    fee: 1000000,
    sessionDates: ["2026-10-05", "2026-10-07"],
    daysOfWeek: ["MONDAY", "WEDNESDAY"],
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
  }

  it("normalizes and converts dates to ISO format", () => {
    const d = new Date(2026, 9, 5) // Oct 5, 2026
    expect(toIsoDate(d)).toBe("2026-10-05")
    expect(normalizeIsoDate("2026-10-05T12:00:00.000Z")).toBe("2026-10-05")
    expect(normalizeIsoDate(d)).toBe("2026-10-05")
    expect(normalizeIsoDate(null)).toBe("")
  })

  it("checks if date is inside a term", () => {
    const insideDate = new Date(2026, 9, 5) // Oct 5, 2026
    const outsideDate = new Date(2026, 0, 1) // Jan 1, 2026
    expect(isDateInTerm(insideDate, mockTerm)).toBe(true)
    expect(isDateInTerm(outsideDate, mockTerm)).toBe(false)
  })

  it("filters active terms and classes for date", () => {
    const sessionDate = new Date(2026, 9, 5)
    const nonSessionDate = new Date(2026, 9, 6)

    expect(getActiveTermsForDate(sessionDate, [mockTerm])).toHaveLength(1)
    expect(isDateInAnyTerm(sessionDate, [mockTerm])).toBe(true)

    expect(getClassesForDate(sessionDate, [mockClass])).toHaveLength(1)
    expect(isDateClassSession(sessionDate, [mockClass])).toBe(true)

    expect(getClassesForDate(nonSessionDate, [mockClass])).toHaveLength(0)
    expect(isDateClassSession(nonSessionDate, [mockClass])).toBe(false)
  })

  it("detects terms overlapping a month", () => {
    // Mehr 1405 starts around late Sept 2026
    const mehrDate = new Date(2026, 9, 1)
    const termsInMonth = getTermsRunningInMonth(mehrDate, "fa", [mockTerm])
    expect(termsInMonth).toHaveLength(1)

    // Farvardin (spring) shouldn't overlap fall term
    const farvardinDate = new Date(2026, 2, 25)
    const termsInFarvardin = getTermsRunningInMonth(farvardinDate, "fa", [
      mockTerm,
    ])
    expect(termsInFarvardin).toHaveLength(0)
  })

  it("formats display date safely", () => {
    const d = new Date(2026, 9, 5)
    const faFormatted = formatDisplayDate(d, "fa")
    expect(faFormatted).toBeTruthy()
    const enFormatted = formatDisplayDate(d, "en")
    expect(enFormatted).toBeTruthy()
  })
})
