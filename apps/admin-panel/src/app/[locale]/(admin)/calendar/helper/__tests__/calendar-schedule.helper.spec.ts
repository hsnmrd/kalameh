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

  it("assigns distinct, deterministic visual themes to terms", async () => {
    const { getTermTheme, CALENDAR_TERM_THEMES } =
      await import("../calendar-schedule.helper")
    const term2: TermDto = { ...mockTerm, id: "term-2", title: "ترم زمستان" }
    const theme1 = getTermTheme("term-1", [mockTerm, term2])
    const theme2 = getTermTheme("term-2", [mockTerm, term2])

    expect(theme1.id).toBe(CALENDAR_TERM_THEMES[0]!.id)
    expect(theme2.id).toBe(CALENDAR_TERM_THEMES[1]!.id)
    expect(theme1.id).not.toBe(theme2.id)
  })

  it("filters terms running in a specific year", async () => {
    const { getTermsRunningInYear } =
      await import("../calendar-schedule.helper")
    // 2026 matches mockTerm (Sept 2026 - Dec 2026)
    const terms2026 = getTermsRunningInYear(2026, "en", [mockTerm])
    expect(terms2026).toHaveLength(1)

    // 2024 should not match
    const terms2024 = getTermsRunningInYear(2024, "en", [mockTerm])
    expect(terms2024).toHaveLength(0)
  })

  it("builds separate calendar modifiers for each term", async () => {
    const { buildCalendarTermModifiers } =
      await import("../calendar-schedule.helper")
    const term2: TermDto = {
      ...mockTerm,
      id: "term-2",
      title: "ترم زمستان",
      startDate: "2027-01-05T00:00:00.000Z",
      endDate: "2027-03-20T00:00:00.000Z",
    }

    const { modifiers, modifiersClassNames } = buildCalendarTermModifiers(
      [mockTerm, term2],
      [mockTerm, term2]
    )

    // Check term-1 start, end, range
    expect(modifiers["term_term-1_start"]).toBeDefined()
    expect(modifiers["term_term-1_end"]).toBeDefined()
    expect(modifiers["term_term-1_range"]).toBeDefined()
    expect(modifiersClassNames["term_term-1_start"]).toContain("bg-sky-600")

    // Check term-2 start, end, range
    expect(modifiers["term_term-2_start"]).toBeDefined()
    expect(modifiers["term_term-2_end"]).toBeDefined()
    expect(modifiers["term_term-2_range"]).toBeDefined()
    expect(modifiersClassNames["term_term-2_start"]).toContain("bg-emerald-600")

    // Test modifier date evaluation
    const startDate = new Date(2026, 8, 23) // 2026-09-23
    const rangeDate = new Date(2026, 9, 15) // 2026-10-15
    const endDate = new Date(2026, 11, 21) // 2026-12-21
    const outsideDate = new Date(2026, 5, 1) // 2026-06-01

    expect(modifiers["term_term-1_start"]!(startDate)).toBe(true)
    expect(modifiers["term_term-1_range"]!(rangeDate)).toBe(true)
    expect(modifiers["term_term-1_end"]!(endDate)).toBe(true)

    expect(modifiers["term_term-1_start"]!(outsideDate)).toBe(false)
    expect(modifiers["term_term-1_range"]!(outsideDate)).toBe(false)
    expect(modifiers["term_term-1_end"]!(outsideDate)).toBe(false)
  })
})
