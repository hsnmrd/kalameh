import { describe, it, expect } from "vitest"
import {
  calculateTermEndDate,
  generatePhaseTerms,
  generateTermTitleFromMonths,
  recalculatePhaseTerms,
} from "../src/term/term-session-calculator.js"

describe("Term Session Calculator & Batch Phase Terms Generator", () => {
  describe("calculateTermEndDate", () => {
    it("calculates exact end date for a given session count skipping holidays", () => {
      // Start on 1403/07/01 (Sunday - یکشنبه)
      // Days: ["SATURDAY", "MONDAY", "WEDNESDAY"]
      // 18 sessions
      const result = calculateTermEndDate({
        startDate: "1403/07/01",
        targetSessions: 18,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        skipHolidays: true,
      })

      expect(result.completedSessions).toBe(18)
      expect(result.sessionDates).toHaveLength(18)
      expect(result.startDateJalali).toBe("1403/07/01")
      // First session will be 1403/07/02 (Monday)
      expect(result.sessionDatesJalali[0]).toBe("1403/07/02")
      // End date must be around mid-Aban 1403 (approx 6 weeks)
      expect(result.endDateJalali.startsWith("1403/08/")).toBe(true)
    })

    it("records holidays that fall on class days and extends term end date accordingly", () => {
      // 1403 Shahrivar has Arbaeen (06/04 - Sunday) and Imam Reza (06/14 - Wednesday)
      const withHolidaysSkipped = calculateTermEndDate({
        startDate: "1403/06/01",
        targetSessions: 10,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        skipHolidays: true,
      })

      const withoutHolidaysSkipped = calculateTermEndDate({
        startDate: "1403/06/01",
        targetSessions: 10,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        skipHolidays: false,
      })

      // With holidays skipped, end date must be later or equal
      expect(
        withHolidaysSkipped.endDate >= withoutHolidaysSkipped.endDate
      ).toBe(true)
      expect(withHolidaysSkipped.holidaysEncountered.length).toBeGreaterThan(0)
    })

    it("calculates end date purely based on day count (روز) when no specific daysOfWeek are given", () => {
      // 45 days starting on 1403/07/01
      const result = calculateTermEndDate({
        startDate: "1403/07/01",
        targetDays: 45,
        skipHolidays: true,
      })

      expect(result.targetDays).toBe(45)
      expect(result.totalDaysSpan).toBeGreaterThanOrEqual(45)
      expect(result.startDateJalali).toBe("1403/07/01")
      // 45 days from 1st Mehr ends around mid-Aban
      expect(result.endDateJalali.startsWith("1403/08/")).toBe(true)
    })

    it("respects observeOfficialHolidays = false and does not skip official Jalali holidays", () => {
      // 1403/06/04 is Arbaeen (Sunday)
      const withObservance = calculateTermEndDate({
        startDate: "1403/06/01",
        targetDays: 10,
        daysOfWeek: ["SUNDAY"],
        skipHolidays: true,
        observeOfficialHolidays: true,
      })

      const withoutObservance = calculateTermEndDate({
        startDate: "1403/06/01",
        targetDays: 10,
        daysOfWeek: ["SUNDAY"],
        skipHolidays: true,
        observeOfficialHolidays: false,
      })

      // Without holiday observance, Arbaeen is included as a regular class day, so term finishes sooner
      expect(withoutObservance.endDate < withObservance.endDate).toBe(true)
      expect(withoutObservance.holidaysEncountered).toHaveLength(0)
      expect(withObservance.holidaysEncountered.length).toBeGreaterThan(0)
    })

    it("skips custom institute off-days when provided", () => {
      // 1403/07/01 is 2024-09-22
      // Let's add a custom off-day on 2024-09-23 (1403/07/02)
      const normalResult = calculateTermEndDate({
        startDate: "1403/07/01",
        targetDays: 5,
        daysOfWeek: ["SUNDAY", "MONDAY", "TUESDAY"],
        skipHolidays: true,
      })

      const customOffResult = calculateTermEndDate({
        startDate: "1403/07/01",
        targetDays: 5,
        daysOfWeek: ["SUNDAY", "MONDAY", "TUESDAY"],
        skipHolidays: true,
        customOffDays: [{ date: "2024-09-23", title: "اردوی درون‌استانی" }],
      })

      expect(customOffResult.endDate > normalResult.endDate).toBe(true)
      expect(
        customOffResult.holidaysEncountered.some(
          (h) => h.isCustomOffDay && h.titleFa === "اردوی درون‌استانی"
        )
      ).toBe(true)
      expect(customOffResult.sessionDates).not.toContain("2024-09-23")
    })
  })

  describe("generateTermTitleFromMonths", () => {
    it("names 3-month seasonal blocks by season name", () => {
      expect(generateTermTitleFromMonths([7, 8, 9], 1403)).toBe("پاییز ۱۴۰۳")
      expect(generateTermTitleFromMonths([10, 11, 12], 1403)).toBe(
        "زمستان ۱۴۰۳"
      )
      expect(generateTermTitleFromMonths([1, 2, 3], 1404)).toBe("بهار ۱۴۰۴")
      expect(generateTermTitleFromMonths([4, 5, 6], 1404)).toBe("تابستان ۱۴۰۴")
    })

    it("names 1 or 2 month blocks by month names", () => {
      expect(generateTermTitleFromMonths([7, 8], 1403)).toBe("مهر و آبان ۱۴۰۳")
      expect(generateTermTitleFromMonths([9, 10], 1403)).toBe("آذر و دی ۱۴۰۳")
      expect(generateTermTitleFromMonths([4], 1404)).toBe("تیر ۱۴۰۴")
    })

    it("names 3+ non-seasonal months concisely with تا", () => {
      expect(generateTermTitleFromMonths([8, 9, 10], 1405)).toBe(
        "آبان تا دی ۱۴۰۵"
      )
      expect(generateTermTitleFromMonths([1, 2, 3, 4], 1405)).toBe(
        "فروردین تا تیر ۱۴۰۵"
      )
    })

    it("orders year-wrapping months chronologically (e.g. Esfand to Ordibehesht)", () => {
      // In chronological order [12, 1, 2]
      expect(generateTermTitleFromMonths([12, 1, 2], 1405)).toBe(
        "اسفند تا اردیبهشت ۱۴۰۵"
      )
      // Even if passed as [1, 2, 12]
      expect(generateTermTitleFromMonths([1, 2, 12], 1405)).toBe(
        "اسفند تا اردیبهشت ۱۴۰۵"
      )
      // Two months across new year: [12, 1] or [1, 12]
      expect(generateTermTitleFromMonths([12, 1], 1405)).toBe(
        "اسفند و فروردین ۱۴۰۵"
      )
      expect(generateTermTitleFromMonths([1, 12], 1405)).toBe(
        "اسفند و فروردین ۱۴۰۵"
      )
    })
  })

  describe("generatePhaseTerms", () => {
    it("generates consecutive terms covering a phase's months", () => {
      // Phase for Autumn & Winter (Months 7, 8, 9, 10, 11, 12)
      const proposals = generatePhaseTerms({
        phase: {
          id: "phase-academic-1",
          title: "سال تحصیلی",
          months: [7, 8, 9, 10, 11, 12],
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        jalaliYear: 1403,
        sessionsPerTerm: 18,
        gapDaysBetweenTerms: 2,
      })

      expect(proposals.length).toBeGreaterThanOrEqual(2)
      // Term 1 starts at 1403/07/01
      expect(proposals[0].startDateJalali).toBe("1403/07/01")
      expect(proposals[0].title).toBe("مهر و آبان ۱۴۰۳")
      expect(proposals[0].sessionsCount).toBe(18)
      expect(proposals[0].operatingPhaseId).toBe("phase-academic-1")

      // Term 2 starts after Term 1 ends
      expect(proposals[1].startDate > proposals[0].endDate).toBe(true)
    })
  })

  describe("recalculatePhaseTerms", () => {
    it("cascades updates when a term start date is shifted forward (e.g. after Nowruz)", () => {
      const initialProposals = generatePhaseTerms({
        phase: {
          id: "phase-academic-1",
          title: "سال تحصیلی",
          months: [7, 8, 9, 10, 11, 12, 1, 2],
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        jalaliYear: 1403,
        sessionsPerTerm: 18,
        gapDaysBetweenTerms: 2,
      })

      expect(initialProposals.length).toBeGreaterThanOrEqual(3)

      // Shift Term 1 (second term, index 1) forward by 2 weeks
      const originalTerm1Start = initialProposals[1].startDateJalali
      const originalTerm2Start = initialProposals[2].startDateJalali

      const updated = recalculatePhaseTerms({
        proposals: initialProposals,
        changedIndex: 1,
        newStartDate: "1403/09/15",
        sessionsPerTerm: 18,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        gapDaysBetweenTerms: 2,
      })

      // Term 1 start date is updated
      expect(updated[1].startDateJalali).toBe("1403/09/15")
      // Term 1 end date is updated and later
      expect(updated[1].endDate > initialProposals[1].endDate).toBe(true)

      // Term 2 start date is cascaded and shifted forward
      expect(updated[2].startDate > originalTerm2Start).toBe(true)
      expect(updated[2].startDate > updated[1].endDate).toBe(true)

      // Term 0 remains completely unchanged
      expect(updated[0].startDateJalali).toBe(
        initialProposals[0].startDateJalali
      )
      expect(updated[0].endDateJalali).toBe(initialProposals[0].endDateJalali)
    })

    it("prevents shifting backward earlier than or equal to previous term end date", () => {
      const initialProposals = generatePhaseTerms({
        phase: {
          id: "phase-academic-1",
          title: "سال تحصیلی",
          months: [7, 8, 9, 10],
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        jalaliYear: 1403,
        sessionsPerTerm: 18,
        gapDaysBetweenTerms: 2,
      })

      // Attempt to shift Term 1 before Term 0 ends
      expect(() =>
        recalculatePhaseTerms({
          proposals: initialProposals,
          changedIndex: 1,
          newStartDate: initialProposals[0].startDateJalali,
          sessionsPerTerm: 18,
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        })
      ).toThrowError(/تاریخ شروع نمی‌تواند همزمان یا قبل از پایان ترم قبلی/)
    })

    it("preserves user custom title if specified", () => {
      const initialProposals = generatePhaseTerms({
        phase: {
          id: "phase-academic-1",
          title: "سال تحصیلی",
          months: [7, 8, 9, 10],
          daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        },
        jalaliYear: 1403,
        sessionsPerTerm: 18,
        gapDaysBetweenTerms: 2,
      })

      const updated = recalculatePhaseTerms({
        proposals: initialProposals,
        changedIndex: 0,
        newStartDate: "1403/07/07",
        sessionsPerTerm: 18,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        userCustomTitles: { 0: "ترم فشرده پاییزی" },
      })

      expect(updated[0].title).toBe("ترم فشرده پاییزی")
    })
  })
})
