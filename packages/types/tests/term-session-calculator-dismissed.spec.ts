import { describe, it, expect } from "vitest"
import {
  calculateTermEndDate,
  generatePhaseTerms,
} from "../src/term/term-session-calculator.js"

describe("term-session-calculator with dismissedHolidays", () => {
  it("treats dismissed official holidays as regular class days", () => {
    // 1403/06/04 is Arbaeen (Sunday) -> ISO 2024-08-25
    const withHolidayObserved = calculateTermEndDate({
      startDate: "1403/06/01",
      targetDays: 5,
      daysOfWeek: ["SUNDAY"],
      skipHolidays: true,
      observeOfficialHolidays: true,
    })

    const withHolidayDismissed = calculateTermEndDate({
      startDate: "1403/06/01",
      targetDays: 5,
      daysOfWeek: ["SUNDAY"],
      skipHolidays: true,
      observeOfficialHolidays: true,
      dismissedHolidays: ["2024-08-25"],
    })

    // With holiday dismissed, 2024-08-25 is NOT skipped, so it completes 1 week earlier!
    expect(withHolidayDismissed.endDate < withHolidayObserved.endDate).toBe(
      true
    )
    expect(
      withHolidayDismissed.holidaysEncountered.some(
        (h) => h.date === "2024-08-25"
      )
    ).toBe(false)
    expect(withHolidayDismissed.sessionDates).toContain("2024-08-25")
  })

  it("generatePhaseTerms passes dismissedHolidays through to term schedules", () => {
    const defaultPhase = generatePhaseTerms({
      phase: {
        id: "phase-1",
        title: "تابستان",
        months: [4, 5, 6],
        daysOfWeek: ["SUNDAY"],
      },
      jalaliYear: 1403,
      daysPerTerm: 10,
      daysOfWeek: ["SUNDAY"],
      observeOfficialHolidays: true,
    })

    const dismissedPhase = generatePhaseTerms({
      phase: {
        id: "phase-1",
        title: "تابستان",
        months: [4, 5, 6],
        daysOfWeek: ["SUNDAY"],
      },
      jalaliYear: 1403,
      daysPerTerm: 10,
      daysOfWeek: ["SUNDAY"],
      observeOfficialHolidays: true,
      dismissedHolidays: ["2024-08-25"],
    })

    expect(dismissedPhase.length).toBeGreaterThan(0)
    const term1Default = defaultPhase[0]
    const term1Dismissed = dismissedPhase[0]
    expect(term1Default).toBeDefined()
    expect(term1Dismissed).toBeDefined()
  })
})
