import { describe, expect, it } from "vitest"
import {
  calculatePhaseSlots,
  CreateOperatingPhaseSchema,
  getCurrentJalaliMonth,
  isOperatingPhaseCurrent,
  JALALI_MONTHS,
  suggestPhaseBreakWindow,
} from "../src/index.js"

describe("Operating Phase Schemas & Slot Calculation", () => {
  it("defines 12 Jalali months correctly", () => {
    expect(JALALI_MONTHS).toHaveLength(12)
    expect(JALALI_MONTHS[0].nameFa).toBe("فروردین")
    expect(JALALI_MONTHS[6].nameFa).toBe("مهر")
    expect(JALALI_MONTHS[11].nameFa).toBe("اسفند")
  })

  describe("calculatePhaseSlots", () => {
    it("calculates slots accurately with exact division (no remainder)", () => {
      // 15:00 to 21:00 = 360 mins. 360 / 90 = 4 slots
      const result = calculatePhaseSlots("15:00", "21:00", 90)

      expect(result.totalSpanMinutes).toBe(360)
      expect(result.fullSlotsCount).toBe(4)
      expect(result.remainderMinutes).toBe(0)
      expect(result.hasWarning).toBe(false)
      expect(result.warningMessageFa).toBeUndefined()
      expect(result.slots).toEqual([
        {
          slotNumber: 1,
          startTime: "15:00",
          endTime: "16:30",
          durationMinutes: 90,
        },
        {
          slotNumber: 2,
          startTime: "16:30",
          endTime: "18:00",
          durationMinutes: 90,
        },
        {
          slotNumber: 3,
          startTime: "18:00",
          endTime: "19:30",
          durationMinutes: 90,
        },
        {
          slotNumber: 4,
          startTime: "19:30",
          endTime: "21:00",
          durationMinutes: 90,
        },
      ])
    })

    it("detects remainder time and produces appropriate warnings", () => {
      // 15:00 to 21:15 = 375 mins. 375 / 90 = 4 slots (360 mins) + 15 min remainder
      const result = calculatePhaseSlots("15:00", "21:15", 90)

      expect(result.totalSpanMinutes).toBe(375)
      expect(result.fullSlotsCount).toBe(4)
      expect(result.remainderMinutes).toBe(15)
      expect(result.hasWarning).toBe(true)
      expect(result.warningMessageFa).toContain("15 دقیقه زمان مازاد")
      expect(result.warningMessageEn).toContain(
        "leaving a remainder of 15 minutes"
      )
      expect(result.slots).toHaveLength(4)
      expect(result.slots[3]).toEqual({
        slotNumber: 4,
        startTime: "19:30",
        endTime: "21:00",
        durationMinutes: 90,
      })
    })

    it("handles invalid or inverted times gracefully", () => {
      const result = calculatePhaseSlots("21:00", "15:00", 90)
      expect(result.totalSpanMinutes).toBe(0)
      expect(result.fullSlotsCount).toBe(0)
      expect(result.remainderMinutes).toBe(0)
      expect(result.slots).toHaveLength(0)
      expect(result.hasWarning).toBe(false)
    })

    it("handles break window correctly and separates shifts", () => {
      // 08:30 to 20:30 (total 720 mins)
      // Break: 13:00 to 14:30 (90 mins)
      // Shift 1: 08:30 to 13:00 (270 mins = 3 slots of 90 min)
      // Shift 2: 14:30 to 20:30 (360 mins = 4 slots of 90 min)
      // Total full slots = 7, remainder = 0
      const result = calculatePhaseSlots("08:30", "20:30", 90, {
        hasBreak: true,
        breakStartTime: "13:00",
        breakEndTime: "14:30",
      })

      expect(result.totalSpanMinutes).toBe(720)
      expect(result.instructionalMinutes).toBe(630)
      expect(result.fullSlotsCount).toBe(7)
      expect(result.remainderMinutes).toBe(0)
      expect(result.hasWarning).toBe(false)
      expect(result.breakInfo?.hasBreak).toBe(true)
      expect(result.breakInfo?.durationMinutes).toBe(90)
      expect(result.shift1Slots).toHaveLength(3)
      expect(result.shift2Slots).toHaveLength(4)
      expect(result.slots).toHaveLength(7)

      // Shift 1 slots
      expect(result.slots[0]).toEqual({
        slotNumber: 1,
        startTime: "08:30",
        endTime: "10:00",
        durationMinutes: 90,
        shift: 1,
      })
      expect(result.slots[2]).toEqual({
        slotNumber: 3,
        startTime: "11:30",
        endTime: "13:00",
        durationMinutes: 90,
        shift: 1,
      })

      // Shift 2 slots (continues numbering)
      expect(result.slots[3]).toEqual({
        slotNumber: 4,
        startTime: "14:30",
        endTime: "16:00",
        durationMinutes: 90,
        shift: 2,
      })
      expect(result.slots[6]).toEqual({
        slotNumber: 7,
        startTime: "19:00",
        endTime: "20:30",
        durationMinutes: 90,
        shift: 2,
      })
    })

    it("handles break window with remainder in shifts", () => {
      // Shift 1: 08:30 to 13:15 (285 mins = 3 * 90 + 15 mins remainder)
      // Break: 13:15 to 14:30
      // Shift 2: 14:30 to 20:30 (360 mins = 4 * 90 + 0 remainder)
      const result = calculatePhaseSlots("08:30", "20:30", 90, {
        hasBreak: true,
        breakStartTime: "13:15",
        breakEndTime: "14:30",
      })

      expect(result.fullSlotsCount).toBe(7)
      expect(result.remainderMinutes).toBe(15)
      expect(result.shift1RemainderMinutes).toBe(15)
      expect(result.shift2RemainderMinutes).toBe(0)
      expect(result.hasWarning).toBe(true)
      expect(result.warningMessageFa).toContain(
        "شیفت اول دارای 15 دقیقه زمان مازاد است"
      )
    })
  })

  describe("CreateOperatingPhaseSchema", () => {
    it("validates a complete and correct phase input", () => {
      const valid = {
        title: "فاز سال تحصیلی (مهر تا خرداد)",
        months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
        startTime: "15:00",
        endTime: "21:00",
        slotDurationMinutes: 90,
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
      }

      const parsed = CreateOperatingPhaseSchema.parse(valid)
      expect(parsed.title).toBe(valid.title)
      expect(parsed.months).toEqual(valid.months)
      expect(parsed.isActive).toBe(true)
    })

    it("fails validation if endTime is before or equal to startTime", () => {
      const invalid = {
        title: "فاز نامعتبر",
        months: [1, 2],
        startTime: "18:00",
        endTime: "16:00",
      }

      expect(() => CreateOperatingPhaseSchema.parse(invalid)).toThrow()
    })

    it("fails validation if months array is empty", () => {
      const invalid = {
        title: "فاز بدون ماه",
        months: [],
        startTime: "14:00",
        endTime: "20:00",
      }

      expect(() => CreateOperatingPhaseSchema.parse(invalid)).toThrow()
    })

    it("validates phase with valid break window", () => {
      const validWithBreak = {
        title: "فاز دو شیفته",
        months: [4, 5, 6],
        startTime: "08:30",
        endTime: "20:30",
        slotDurationMinutes: 90,
        daysOfWeek: ["SATURDAY", "MONDAY"],
        hasBreak: true,
        breakStartTime: "13:00",
        breakEndTime: "14:30",
      }

      const parsed = CreateOperatingPhaseSchema.parse(validWithBreak)
      expect(parsed.hasBreak).toBe(true)
      expect(parsed.breakStartTime).toBe("13:00")
      expect(parsed.breakEndTime).toBe("14:30")
    })

    it("fails validation if hasBreak is true but break times are missing or invalid order", () => {
      const missingTimes = {
        title: "فاز دو شیفته ناقص",
        months: [4, 5, 6],
        startTime: "08:30",
        endTime: "20:30",
        hasBreak: true,
      }
      expect(() => CreateOperatingPhaseSchema.parse(missingTimes)).toThrow()

      const invertedBreak = {
        title: "فاز دو شیفته معکوس",
        months: [4, 5, 6],
        startTime: "08:30",
        endTime: "20:30",
        hasBreak: true,
        breakStartTime: "15:00",
        breakEndTime: "14:00",
      }
      expect(() => CreateOperatingPhaseSchema.parse(invertedBreak)).toThrow()

      const breakOutside = {
        title: "فاز دو شیفته خارج بازه",
        months: [4, 5, 6],
        startTime: "08:30",
        endTime: "20:30",
        hasBreak: true,
        breakStartTime: "07:00",
        breakEndTime: "14:00",
      }
      expect(() => CreateOperatingPhaseSchema.parse(breakOutside)).toThrow()
    })
  })

  describe("suggestPhaseBreakWindow", () => {
    it("suggests optimal mid-day break capped at 1 hour for full day shift", () => {
      // 08:30 to 20:30, slot = 90 min
      // Midday lunch aligns at 13:00 (after 3 full 90m slots: 08:30-10:00, 10:00-11:30, 11:30-13:00)
      // Break: 13:00 to 14:00 (60 mins = 1 hour max)
      const suggestion = suggestPhaseBreakWindow("08:30", "20:30", 90, 60)

      expect(suggestion.breakStartTime).toBe("13:00")
      expect(suggestion.breakEndTime).toBe("14:00")
      expect(suggestion.breakDurationMinutes).toBe(60)
      expect(suggestion.breakDurationMinutes).toBeLessThanOrEqual(60)
    })

    it("suggests 60-min break that perfectly absorbs remainder to 0 for 08:00 to 18:00", () => {
      // 08:00 to 18:00 (600 mins), slot = 90 min
      // 3 slots (08:00-12:30), break 12:30-13:30 (60 min), 3 slots (13:30-18:00) -> 0 remainder!
      const suggestion = suggestPhaseBreakWindow("08:00", "18:00", 90, 60)

      expect(suggestion.breakStartTime).toBe("12:30")
      expect(suggestion.breakEndTime).toBe("13:30")
      expect(suggestion.breakDurationMinutes).toBe(60)

      // Verify that this break results in 0 remainder when fed into calculatePhaseSlots
      const calculated = calculatePhaseSlots("08:00", "18:00", 90, {
        hasBreak: true,
        breakStartTime: suggestion.breakStartTime,
        breakEndTime: suggestion.breakEndTime,
      })
      expect(calculated.fullSlotsCount).toBe(6)
      expect(calculated.remainderMinutes).toBe(0)
      expect(calculated.hasWarning).toBe(false)
    })

    it("suggests mid-shift break for evening shift", () => {
      // 14:00 to 21:00 (420 mins), slot = 90 min
      // Shift 1: 14:00 to 17:00 (2 slots = 180 min)
      // Break: 17:00 to 18:00 (60 mins)
      // Shift 2: 18:00 to 21:00 (2 slots = 180 min) -> 0 remainder!
      const suggestion = suggestPhaseBreakWindow("14:00", "21:00", 90, 60)

      expect(suggestion.breakStartTime).toBe("17:00")
      expect(suggestion.breakEndTime).toBe("18:00")
      expect(suggestion.breakDurationMinutes).toBe(60)

      const calculated = calculatePhaseSlots("14:00", "21:00", 90, {
        hasBreak: true,
        breakStartTime: suggestion.breakStartTime,
        breakEndTime: suggestion.breakEndTime,
      })
      expect(calculated.fullSlotsCount).toBe(4)
      expect(calculated.remainderMinutes).toBe(0)
      expect(calculated.hasWarning).toBe(false)
    })

    it("handles 60-min session duration properly", () => {
      // 08:00 to 16:00 (480 mins), slot = 60 min
      // 4 slots morning (08:00-12:00), break 12:00-13:00 (60m), 3 slots afternoon (13:00-16:00)
      const suggestion = suggestPhaseBreakWindow("08:00", "16:00", 60, 60)

      expect(suggestion.breakStartTime).toBe("12:00")
      expect(suggestion.breakEndTime).toBe("13:00")
      expect(suggestion.breakDurationMinutes).toBe(60)
    })

    it("handles invalid or tight times without crashing and respects max 1 hour", () => {
      const invalid = suggestPhaseBreakWindow("20:00", "08:00", 90, 60)
      expect(invalid.breakDurationMinutes).toBeLessThanOrEqual(60)

      const tight = suggestPhaseBreakWindow("12:00", "14:00", 90, 60)
      expect(tight.breakDurationMinutes).toBeLessThanOrEqual(60)
    })
  })

  describe("getCurrentJalaliMonth & isOperatingPhaseCurrent", () => {
    it("returns a valid Jalali month number between 1 and 12", () => {
      const currentMonth = getCurrentJalaliMonth()
      expect(currentMonth).toBeGreaterThanOrEqual(1)
      expect(currentMonth).toBeLessThanOrEqual(12)
    })

    it("correctly identifies whether a phase is currently in effect", () => {
      // Phase covering Mehr to Khordad (7, 8, 9, 10, 11, 12, 1, 2, 3)
      const schoolYearPhase = {
        months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
        isActive: true,
      }

      // Phase covering Summer (4, 5, 6)
      const summerPhase = {
        months: [4, 5, 6],
        isActive: true,
      }

      // In Shahrivar (month 6)
      expect(isOperatingPhaseCurrent(summerPhase, 6)).toBe(true)
      expect(isOperatingPhaseCurrent(schoolYearPhase, 6)).toBe(false)

      // In Mehr (month 7)
      expect(isOperatingPhaseCurrent(summerPhase, 7)).toBe(false)
      expect(isOperatingPhaseCurrent(schoolYearPhase, 7)).toBe(true)
    })

    it("returns false if phase is inactive even if current month matches", () => {
      const inactiveSummerPhase = {
        months: [4, 5, 6],
        isActive: false,
      }

      expect(isOperatingPhaseCurrent(inactiveSummerPhase, 6)).toBe(false)
    })
  })
})
