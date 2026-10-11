import { describe, it, expect } from "vitest"
import {
  isClassDone,
  isClassFinished,
  parseDateWithEndTime,
} from "../src/class/class-status.helper.js"

describe("Class Status Helper", () => {
  describe("parseDateWithEndTime", () => {
    it("returns null for empty or invalid inputs", () => {
      expect(parseDateWithEndTime("")).toBeNull()
      expect(parseDateWithEndTime(null as any)).toBeNull()
      expect(parseDateWithEndTime("not-a-date")).toBeNull()
    })

    it("parses date string with endTime correctly", () => {
      const parsed = parseDateWithEndTime("2026-10-15", "14:30")
      expect(parsed).not.toBeNull()
      expect(parsed?.getFullYear()).toBe(2026)
      expect(parsed?.getMonth()).toBe(9) // 0-indexed October
      expect(parsed?.getDate()).toBe(15)
      expect(parsed?.getHours()).toBe(14)
      expect(parsed?.getMinutes()).toBe(30)
      expect(parsed?.getSeconds()).toBe(0)
    })

    it("defaults to end of day when no endTime is supplied", () => {
      const parsed = parseDateWithEndTime("2026-10-15")
      expect(parsed).not.toBeNull()
      expect(parsed?.getFullYear()).toBe(2026)
      expect(parsed?.getMonth()).toBe(9)
      expect(parsed?.getDate()).toBe(15)
      expect(parsed?.getHours()).toBe(23)
      expect(parsed?.getMinutes()).toBe(59)
      expect(parsed?.getSeconds()).toBe(59)
      expect(parsed?.getMilliseconds()).toBe(999)
    })

    it("handles Date objects correctly", () => {
      const date = new Date(2026, 9, 20)
      const parsed = parseDateWithEndTime(date, "09:00")
      expect(parsed?.getHours()).toBe(9)
      expect(parsed?.getMinutes()).toBe(0)
    })
  })

  describe("isClassDone / isClassFinished", () => {
    it("returns false for null or undefined class", () => {
      expect(isClassDone(null)).toBe(false)
      expect(isClassDone(undefined)).toBe(false)
      expect(isClassFinished(null)).toBe(false)
    })

    it("returns true when term is inactive (isActive === false)", () => {
      const cls = {
        term: {
          isActive: false,
          endDate: "2026-12-31",
        },
        sessionDates: ["2026-12-01", "2026-12-15"],
      }
      expect(isClassDone(cls, new Date("2026-10-01"))).toBe(true)
    })

    describe("when sessionDates are provided", () => {
      it("returns true when all session dates are in the past", () => {
        const cls = {
          sessionDates: ["2026-09-10", "2026-09-15", "2026-10-01"],
          term: {
            isActive: true,
            endDate: "2026-11-30",
          },
        }
        // Now is after last session (2026-10-01)
        const now = new Date("2026-10-02T10:00:00")
        expect(isClassDone(cls, now)).toBe(true)
      })

      it("returns false when there are future sessions remaining", () => {
        const cls = {
          sessionDates: ["2026-09-10", "2026-10-01", "2026-10-20"],
          term: {
            isActive: true,
            endDate: "2026-11-30",
          },
        }
        const now = new Date("2026-10-02T10:00:00")
        expect(isClassDone(cls, now)).toBe(false)
      })

      it("correctly sorts session dates when they are provided out of order", () => {
        const cls = {
          sessionDates: ["2026-10-15", "2026-09-01", "2026-10-01"],
          term: { isActive: true },
        }
        // Before Oct 15 -> not done
        expect(isClassDone(cls, new Date("2026-10-05"))).toBe(false)
        // After Oct 15 -> done
        expect(isClassDone(cls, new Date("2026-10-16"))).toBe(true)
      })

      it("evaluates endTime precision on the last session date", () => {
        const cls = {
          sessionDates: ["2026-10-11"],
          endTime: "13:00",
          term: { isActive: true },
        }
        // Same day before 13:00 -> not done
        const beforeEnd = new Date(2026, 9, 11, 12, 30, 0)
        expect(isClassDone(cls, beforeEnd)).toBe(false)

        // Same day after 13:00 -> done
        const afterEnd = new Date(2026, 9, 11, 13, 1, 0)
        expect(isClassDone(cls, afterEnd)).toBe(true)
      })

      it("defaults to end of day if no endTime is provided on last session date", () => {
        const cls = {
          sessionDates: ["2026-10-11"],
          term: { isActive: true },
        }
        // Same day afternoon -> not done yet (ends at 23:59:59.999)
        const duringDay = new Date(2026, 9, 11, 16, 0, 0)
        expect(isClassDone(cls, duringDay)).toBe(false)

        // Next day -> done
        const nextDay = new Date(2026, 9, 12, 0, 1, 0)
        expect(isClassDone(cls, nextDay)).toBe(true)
      })
    })

    describe("when sessionDates are not provided (fallback to term.endDate)", () => {
      it("returns true when term.endDate has passed", () => {
        const cls = {
          sessionDates: [],
          term: {
            isActive: true,
            endDate: "2026-09-30",
          },
        }
        const now = new Date("2026-10-05")
        expect(isClassDone(cls, now)).toBe(true)
      })

      it("returns false when term.endDate is in the future", () => {
        const cls = {
          sessionDates: [],
          term: {
            isActive: true,
            endDate: "2026-12-31",
          },
        }
        const now = new Date("2026-10-05")
        expect(isClassDone(cls, now)).toBe(false)
      })

      it("evaluates term.endDate with endTime when specified", () => {
        const cls = {
          sessionDates: null,
          endTime: "16:00",
          term: {
            isActive: true,
            endDate: "2026-10-11",
          },
        }
        const beforeEnd = new Date(2026, 9, 11, 15, 30, 0)
        expect(isClassDone(cls, beforeEnd)).toBe(false)

        const afterEnd = new Date(2026, 9, 11, 16, 5, 0)
        expect(isClassDone(cls, afterEnd)).toBe(true)
      })
    })

    it("returns false when no dates and no term info are available", () => {
      const cls = {
        sessionDates: [],
        term: null,
      }
      expect(isClassDone(cls)).toBe(false)
    })
  })
})
