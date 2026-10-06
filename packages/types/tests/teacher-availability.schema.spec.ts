import { describe, expect, it } from "vitest"
import {
  isAvailabilityCoveringSlot,
  subtractSlotFromAvailability,
  type TeacherAvailabilityInput,
} from "../src/index.js"

describe("Teacher Availability Helpers", () => {
  describe("isAvailabilityCoveringSlot", () => {
    it("returns true for exact slot match", () => {
      const avail = { startTime: "15:00", endTime: "16:30" }
      const slot = { startTime: "15:00", endTime: "16:30" }
      expect(isAvailabilityCoveringSlot(avail, slot)).toBe(true)
    })

    it("returns true when availability spans multiple slots", () => {
      const avail = { startTime: "15:00", endTime: "20:00" }

      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "15:00",
          endTime: "16:30",
        })
      ).toBe(true)
      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "16:30",
          endTime: "18:00",
        })
      ).toBe(true)
      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "18:00",
          endTime: "19:30",
        })
      ).toBe(true)
    })

    it("returns false when slot extends beyond availability end time", () => {
      const avail = { startTime: "15:00", endTime: "20:00" }
      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "19:30",
          endTime: "21:00",
        })
      ).toBe(false)
    })

    it("returns false when slot starts before availability start time", () => {
      const avail = { startTime: "15:00", endTime: "20:00" }
      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "14:00",
          endTime: "15:30",
        })
      ).toBe(false)
    })

    it("returns false for invalid time formats", () => {
      const avail = { startTime: "invalid", endTime: "20:00" }
      expect(
        isAvailabilityCoveringSlot(avail, {
          startTime: "15:00",
          endTime: "16:30",
        })
      ).toBe(false)
    })
  })

  describe("subtractSlotFromAvailability", () => {
    it("returns empty array when item exactly matches the subtracted slot", () => {
      const item: TeacherAvailabilityInput = {
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "17:30",
      }
      const result = subtractSlotFromAvailability(item, {
        startTime: "16:00",
        endTime: "17:30",
      })
      expect(result).toEqual([])
    })

    it("trims the left side when subtracted slot starts at availability start", () => {
      const item: TeacherAvailabilityInput = {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "20:00",
      }
      const result = subtractSlotFromAvailability(item, {
        startTime: "15:00",
        endTime: "16:30",
      })
      expect(result).toEqual([
        {
          dayOfWeek: "SATURDAY",
          startTime: "16:30",
          endTime: "20:00",
        },
      ])
    })

    it("trims the right side when subtracted slot ends at availability end", () => {
      const item: TeacherAvailabilityInput = {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "20:00",
      }
      const result = subtractSlotFromAvailability(item, {
        startTime: "18:00",
        endTime: "20:00",
      })
      expect(result).toEqual([
        {
          dayOfWeek: "SATURDAY",
          startTime: "15:00",
          endTime: "18:00",
        },
      ])
    })

    it("splits into two intervals when subtracted slot is in the middle", () => {
      const item: TeacherAvailabilityInput = {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "20:00",
      }
      const result = subtractSlotFromAvailability(item, {
        startTime: "16:30",
        endTime: "18:00",
      })
      expect(result).toEqual([
        {
          dayOfWeek: "SATURDAY",
          startTime: "15:00",
          endTime: "16:30",
        },
        {
          dayOfWeek: "SATURDAY",
          startTime: "18:00",
          endTime: "20:00",
        },
      ])
    })

    it("returns unchanged item when slot does not overlap", () => {
      const item: TeacherAvailabilityInput = {
        dayOfWeek: "SATURDAY",
        startTime: "15:00",
        endTime: "20:00",
      }
      const result = subtractSlotFromAvailability(item, {
        startTime: "08:00",
        endTime: "12:00",
      })
      expect(result).toEqual([item])
    })
  })
})
