import { describe, it, expect } from "vitest"
import {
  hasTermDateConflict,
  getOverlappingDateRange,
  checkTermsDateOverlap,
  findTermDateConflicts,
  normalizeCalendarDate,
} from "../src/term/term-date-conflict"

describe("term-date-conflict", () => {
  describe("normalizeCalendarDate", () => {
    it("normalizes ISO string to YYYY-MM-DD", () => {
      expect(normalizeCalendarDate("2026-03-21T00:00:00.000Z")).toBe(
        "2026-03-21"
      )
      expect(normalizeCalendarDate("2026-03-21")).toBe("2026-03-21")
    })

    it("normalizes Jalali date string to Gregorian YYYY-MM-DD", () => {
      expect(normalizeCalendarDate("1405/01/01")).toBe("2026-03-21")
    })

    it("normalizes Date object to YYYY-MM-DD", () => {
      const d = new Date(2026, 2, 21, 12, 0, 0)
      expect(normalizeCalendarDate(d)).toBe("2026-03-21")
    })
  })

  describe("hasTermDateConflict", () => {
    it("detects conflict when two terms share the exact same boundary day", () => {
      // Term A ends on 2026-05-03, Term B starts on 2026-05-03
      const termA = { startDate: "2026-03-21", endDate: "2026-05-03" }
      const termB = { startDate: "2026-05-03", endDate: "2026-06-10" }

      expect(hasTermDateConflict(termA, termB)).toBe(true)
      expect(hasTermDateConflict(termB, termA)).toBe(true)
    })

    it("returns false when terms do not share any days (adjacent days)", () => {
      // Term A ends on 2026-05-03, Term B starts on 2026-05-04
      const termA = { startDate: "2026-03-21", endDate: "2026-05-03" }
      const termB = { startDate: "2026-05-04", endDate: "2026-06-10" }

      expect(hasTermDateConflict(termA, termB)).toBe(false)
      expect(hasTermDateConflict(termB, termA)).toBe(false)
    })

    it("detects conflict when one term is fully inside another", () => {
      const termA = { startDate: "2026-03-21", endDate: "2026-06-10" }
      const termB = { startDate: "2026-04-01", endDate: "2026-05-01" }

      expect(hasTermDateConflict(termA, termB)).toBe(true)
      expect(hasTermDateConflict(termB, termA)).toBe(true)
    })

    it("detects conflict when two terms partially overlap across multiple days", () => {
      const termA = { startDate: "2026-03-21", endDate: "2026-05-10" }
      const termB = { startDate: "2026-05-01", endDate: "2026-06-15" }

      expect(hasTermDateConflict(termA, termB)).toBe(true)
      expect(hasTermDateConflict(termB, termA)).toBe(true)
    })

    it("works with Jalali dates formatted as YYYY/MM/DD", () => {
      // 1405/01/01 to 1405/02/13, and 1405/02/13 to 1405/03/21 share 1405/02/13
      const termA = { startDate: "1405/01/01", endDate: "1405/02/13" }
      const termB = { startDate: "1405/02/13", endDate: "1405/03/21" }

      expect(hasTermDateConflict(termA, termB)).toBe(true)

      // 1405/02/14 starts the day after 1405/02/13
      const termC = { startDate: "1405/02/14", endDate: "1405/03/21" }
      expect(hasTermDateConflict(termA, termC)).toBe(false)
    })
  })

  describe("getOverlappingDateRange", () => {
    it("returns correct overlap interval when terms overlap", () => {
      const termA = { startDate: "2026-03-21", endDate: "2026-05-05" }
      const termB = { startDate: "2026-05-01", endDate: "2026-06-10" }

      const overlap = getOverlappingDateRange(termA, termB)
      expect(overlap).toEqual({
        overlapStart: "2026-05-01",
        overlapEnd: "2026-05-05",
      })
    })

    it("returns null when terms do not overlap", () => {
      const termA = { startDate: "2026-03-21", endDate: "2026-04-30" }
      const termB = { startDate: "2026-05-01", endDate: "2026-06-10" }

      expect(getOverlappingDateRange(termA, termB)).toBeNull()
    })
  })

  describe("checkTermsDateOverlap", () => {
    it("identifies conflicting pairs within a collection of terms", () => {
      const terms = [
        {
          id: "1",
          title: "ترم ۱",
          startDate: "2026-03-21",
          endDate: "2026-05-03",
        },
        {
          id: "2",
          title: "ترم ۲",
          startDate: "2026-05-03",
          endDate: "2026-06-15",
        },
        {
          id: "3",
          title: "ترم ۳",
          startDate: "2026-06-20",
          endDate: "2026-08-01",
        },
      ]

      const result = checkTermsDateOverlap(terms)
      expect(result.hasConflict).toBe(true)
      expect(result.conflictingPair?.[0].id).toBe("1")
      expect(result.conflictingPair?.[1].id).toBe("2")
    })

    it("returns hasConflict: false when all terms are strictly non-overlapping", () => {
      const terms = [
        {
          id: "1",
          title: "ترم ۱",
          startDate: "2026-03-21",
          endDate: "2026-05-03",
        },
        {
          id: "2",
          title: "ترم ۲",
          startDate: "2026-05-06",
          endDate: "2026-06-15",
        },
        {
          id: "3",
          title: "ترم ۳",
          startDate: "2026-06-20",
          endDate: "2026-08-01",
        },
      ]

      const result = checkTermsDateOverlap(terms)
      expect(result.hasConflict).toBe(false)
    })
  })

  describe("findTermDateConflicts", () => {
    it("finds all other terms that conflict with a target term", () => {
      const target = {
        id: "draft",
        title: "پیشنهادی",
        startDate: "2026-05-01",
        endDate: "2026-06-01",
      }
      const existing = [
        {
          id: "1",
          title: "ترم بهار",
          startDate: "2026-03-21",
          endDate: "2026-05-03",
        },
        {
          id: "2",
          title: "ترم تابستان",
          startDate: "2026-05-25",
          endDate: "2026-07-01",
        },
        {
          id: "3",
          title: "ترم پاییز",
          startDate: "2026-09-23",
          endDate: "2026-12-21",
        },
      ]

      const conflicts = findTermDateConflicts(target, existing)
      expect(conflicts).toHaveLength(2)
      expect(conflicts.map((c) => c.id)).toEqual(["1", "2"])
    })
  })
})
