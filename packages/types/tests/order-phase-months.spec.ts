import { describe, it, expect } from "vitest"
import {
  orderPhaseMonths,
  getPhaseMonthTimeline,
  generatePhaseTerms,
  isPhaseInPast,
} from "../src"

describe("orderPhaseMonths & getPhaseMonthTimeline", () => {
  describe("orderPhaseMonths", () => {
    it("returns empty array for empty or missing input", () => {
      expect(orderPhaseMonths([])).toEqual([])
    })

    it("leaves standard single seasons unchanged", () => {
      expect(orderPhaseMonths([1, 2, 3])).toEqual([1, 2, 3])
      expect(orderPhaseMonths([4, 5, 6])).toEqual([4, 5, 6])
      expect(orderPhaseMonths([7, 8, 9])).toEqual([7, 8, 9])
      expect(orderPhaseMonths([10, 11, 12])).toEqual([10, 11, 12])
    })

    it("orders academic phase with summer vacation starting from Mehr (7)", () => {
      // Saved in DB numerically as [1, 2, 3, 7, 8, 9, 10, 11, 12]
      expect(orderPhaseMonths([1, 2, 3, 7, 8, 9, 10, 11, 12])).toEqual([
        7, 8, 9, 10, 11, 12, 1, 2, 3,
      ])
    })

    it("preserves already ordered academic phase", () => {
      expect(orderPhaseMonths([7, 8, 9, 10, 11, 12, 1, 2, 3])).toEqual([
        7, 8, 9, 10, 11, 12, 1, 2, 3,
      ])
    })

    it("orders winter-to-spring wrap phase starting from Dey (10)", () => {
      expect(orderPhaseMonths([1, 2, 10, 11, 12])).toEqual([10, 11, 12, 1, 2])
    })

    it("leaves full 12-month calendar year starting at Farvardin (1)", () => {
      expect(orderPhaseMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      )
    })
  })

  describe("getPhaseMonthTimeline", () => {
    it("returns single-year timeline for non-wrapping phases", () => {
      const timeline = getPhaseMonthTimeline([7, 8, 9], 1405)
      expect(timeline).toEqual([
        { year: 1405, month: 7 },
        { year: 1405, month: 8 },
        { year: 1405, month: 9 },
      ])
    })

    it("increments year for wrapping academic phase", () => {
      const timeline = getPhaseMonthTimeline(
        [7, 8, 9, 10, 11, 12, 1, 2, 3],
        1405
      )
      expect(timeline).toEqual([
        { year: 1405, month: 7 },
        { year: 1405, month: 8 },
        { year: 1405, month: 9 },
        { year: 1405, month: 10 },
        { year: 1405, month: 11 },
        { year: 1405, month: 12 },
        { year: 1406, month: 1 },
        { year: 1406, month: 2 },
        { year: 1406, month: 3 },
      ])
    })
  })

  describe("generatePhaseTerms with academic phase & gap skipping", () => {
    const academicPhase = {
      id: "phase-academic-1",
      title: "فاز تحصیلی",
      months: [1, 2, 3, 7, 8, 9, 10, 11, 12],
      daysOfWeek: [
        "SATURDAY",
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
      ] as const,
    }

    it("generates terms starting at Mehr 1405 for academic phase even when stored numerically", () => {
      const proposals = generatePhaseTerms({
        phase: academicPhase,
        jalaliYear: 1405,
        sessionsPerTerm: 15,
        daysPerTerm: 15,
        daysOfWeek: [...academicPhase.daysOfWeek],
        gapDaysBetweenTerms: 2,
        filterPastTerms: false,
      })

      expect(proposals.length).toBeGreaterThanOrEqual(6)
      // Term 1 must start at 1405/07/01 (Mehr 1405)
      expect(proposals[0].startDateJalali).toBe("1405/07/01")
      // Last term should be in spring 1406
      const lastTerm = proposals[proposals.length - 1]
      expect(lastTerm.startDateJalali.startsWith("1406/")).toBe(true)
    })

    it("does not return empty array when current date is in Mehr 1405", () => {
      // Date in Mehr 1405: 2026-10-12 (Mehr 20, 1405)
      const nowMehr = new Date("2026-10-12T11:00:00+03:30")

      const proposals = generatePhaseTerms({
        phase: academicPhase,
        jalaliYear: 1405,
        sessionsPerTerm: 15,
        daysPerTerm: 15,
        daysOfWeek: [...academicPhase.daysOfWeek],
        gapDaysBetweenTerms: 2,
        filterPastTerms: true,
        now: nowMehr,
      })

      expect(proposals.length).toBeGreaterThan(0)
      for (const p of proposals) {
        // Every proposal returned must end in the future relative to nowMehr
        expect(p.endDate >= "2026-10-12").toBe(true)
      }
    })

    it("skips gap months instead of aborting when an internal phase gap exists", () => {
      const gapPhase = {
        id: "phase-gap-1",
        title: "فاز گپ‌دار",
        months: [1, 2, 3, 7, 8, 9], // Summer (4, 5, 6) and Winter (10, 11, 12) gap
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"] as const,
      }

      const proposals = generatePhaseTerms({
        phase: gapPhase,
        jalaliYear: 1405,
        sessionsPerTerm: 15,
        daysPerTerm: 15,
        daysOfWeek: [...gapPhase.daysOfWeek],
        gapDaysBetweenTerms: 2,
        filterPastTerms: false,
      })

      // Must cover both autumn 1405 and spring 1406 across the winter gap
      expect(proposals.length).toBeGreaterThanOrEqual(4)
      expect(proposals[0].startDateJalali.startsWith("1405/07/")).toBe(true)
      const springTerm = proposals.find((p) =>
        p.startDateJalali.startsWith("1406/01/")
      )
      expect(springTerm).toBeDefined()
    })
  })

  describe("isPhaseInPast with orderPhaseMonths", () => {
    const baseNow = new Date("2026-10-12T11:00:00+03:30") // Mehr 20, 1405

    it("correctly identifies that academic phase in year 1405 is NOT in past", () => {
      // Ends in Khordad 1406
      expect(isPhaseInPast([1, 2, 3, 7, 8, 9, 10, 11, 12], 1405, baseNow)).toBe(
        false
      )
    })

    it("correctly identifies that academic phase in year 1404 IS in past", () => {
      // Ended in Khordad 1405, which is before Mehr 1405
      expect(isPhaseInPast([1, 2, 3, 7, 8, 9, 10, 11, 12], 1404, baseNow)).toBe(
        true
      )
    })
  })
})
