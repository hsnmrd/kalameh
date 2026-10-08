import { describe, it, expect } from "vitest"
import {
  TERM_PRE_ACTIVATION_DAYS,
  TERM_POST_ACTIVATION_DAYS,
  getTermActivationDate,
  getTermPostActivationDate,
  getTermActivationWindow,
  isTermActivated,
  isTermInActivationWindow,
  isTermPostActivationPassed,
  getTermOpeningDate,
  getTermPostOpeningDate,
  getTermOpeningWindow,
  isTermOpened,
  isTermInOpeningWindow,
  isTermEligibleForClassCreation,
  isTermEligibleForClassOpening,
} from "../src/term/term-activation-window.js"

describe("Term Activation Window & Anchor Dates", () => {
  const startDateStr = "2026-10-15T00:00:00.000Z"

  it("defines 7 days before and 7 days after constants", () => {
    expect(TERM_PRE_ACTIVATION_DAYS).toBe(7)
    expect(TERM_POST_ACTIVATION_DAYS).toBe(7)
  })

  it("calculates activationDate exactly 7 days before term startDate at 00:00:00", () => {
    const activationDate = getTermActivationDate(startDateStr)
    const expected = new Date("2026-10-08T00:00:00.000")
    expected.setHours(0, 0, 0, 0)

    expect(activationDate.getDate()).toBe(8)
    expect(activationDate.getMonth()).toBe(9) // October
    expect(activationDate.getFullYear()).toBe(2026)
    expect(activationDate.getHours()).toBe(0)
    expect(activationDate.getMinutes()).toBe(0)
    expect(activationDate.getSeconds()).toBe(0)
  })

  it("calculates postActivationDate exactly 7 days after term startDate at 23:59:59.999", () => {
    const postActivationDate = getTermPostActivationDate(startDateStr)

    expect(postActivationDate.getDate()).toBe(22)
    expect(postActivationDate.getMonth()).toBe(9) // October
    expect(postActivationDate.getFullYear()).toBe(2026)
    expect(postActivationDate.getHours()).toBe(23)
    expect(postActivationDate.getMinutes()).toBe(59)
    expect(postActivationDate.getSeconds()).toBe(59)
    expect(postActivationDate.getMilliseconds()).toBe(999)
  })

  it("returns full activation window object with activationDate, startDate, and postActivationDate", () => {
    const window = getTermActivationWindow(startDateStr)

    expect(window.activationDate.getDate()).toBe(8)
    expect(window.startDate.getDate()).toBe(15)
    expect(window.postActivationDate.getDate()).toBe(22)
    expect(window.activationDate.getTime()).toBeLessThan(
      window.startDate.getTime()
    )
    expect(window.startDate.getTime()).toBeLessThan(
      window.postActivationDate.getTime()
    )
  })

  describe("isTermActivated (true from 7 days before startDate onwards)", () => {
    it("returns false if date is 8 days before start date", () => {
      const eightDaysBefore = new Date("2026-10-07T12:00:00")
      expect(isTermActivated(startDateStr, eightDaysBefore)).toBe(false)
    })

    it("returns true on exact activation date (7 days before)", () => {
      const sevenDaysBefore = new Date("2026-10-08T00:00:00")
      expect(isTermActivated(startDateStr, sevenDaysBefore)).toBe(true)
    })

    it("returns true 3 days before start date", () => {
      const threeDaysBefore = new Date("2026-10-12T14:30:00")
      expect(isTermActivated(startDateStr, threeDaysBefore)).toBe(true)
    })

    it("returns true once startDate has arrived and after", () => {
      const onStartDate = new Date("2026-10-15T00:00:00")
      expect(isTermActivated(startDateStr, onStartDate)).toBe(true)
      const afterStartDate = new Date("2026-10-20T00:00:00")
      expect(isTermActivated(startDateStr, afterStartDate)).toBe(true)
    })
  })

  describe("isTermInActivationWindow ([startDate - 7d, startDate + 7d])", () => {
    it("returns false before activation date", () => {
      const beforeWindow = new Date("2026-10-07T23:59:59")
      expect(isTermInActivationWindow(startDateStr, beforeWindow)).toBe(false)
    })

    it("returns true during the 7 days before start", () => {
      const inPreWindow = new Date("2026-10-10T10:00:00")
      expect(isTermInActivationWindow(startDateStr, inPreWindow)).toBe(true)
    })

    it("returns true on the start date itself", () => {
      const onStartDate = new Date("2026-10-15T12:00:00")
      expect(isTermInActivationWindow(startDateStr, onStartDate)).toBe(true)
    })

    it("returns true during the 7 days after start", () => {
      const inPostWindow = new Date("2026-10-20T18:00:00")
      expect(isTermInActivationWindow(startDateStr, inPostWindow)).toBe(true)
    })

    it("returns true on the 7th day after start date", () => {
      const onBoundary = new Date("2026-10-22T23:59:58")
      expect(isTermInActivationWindow(startDateStr, onBoundary)).toBe(true)
    })

    it("returns false after the 7-day post-start period expires", () => {
      const afterWindow = new Date("2026-10-23T00:00:01")
      expect(isTermInActivationWindow(startDateStr, afterWindow)).toBe(false)
    })
  })

  describe("isTermPostActivationPassed (> startDate + 7d)", () => {
    it("returns false before or within the activation window", () => {
      expect(
        isTermPostActivationPassed(
          startDateStr,
          new Date("2026-10-10T00:00:00")
        )
      ).toBe(false)
      expect(
        isTermPostActivationPassed(
          startDateStr,
          new Date("2026-10-15T00:00:00")
        )
      ).toBe(false)
      expect(
        isTermPostActivationPassed(
          startDateStr,
          new Date("2026-10-22T23:59:58")
        )
      ).toBe(false)
    })

    it("returns true once postActivationDate has passed", () => {
      expect(
        isTermPostActivationPassed(
          startDateStr,
          new Date("2026-10-23T00:00:01")
        )
      ).toBe(true)
      expect(
        isTermPostActivationPassed(
          startDateStr,
          new Date("2026-11-01T00:00:00")
        )
      ).toBe(true)
    })
  })

  describe("Opening aliases compatibility", () => {
    it("mirrors activation functions via opening aliases", () => {
      expect(getTermOpeningDate(startDateStr)).toEqual(
        getTermActivationDate(startDateStr)
      )
      expect(getTermPostOpeningDate(startDateStr)).toEqual(
        getTermPostActivationDate(startDateStr)
      )
      expect(getTermOpeningWindow(startDateStr)).toEqual(
        getTermActivationWindow(startDateStr)
      )
      expect(isTermOpened(startDateStr, new Date("2026-10-10T00:00:00"))).toBe(
        true
      )
      expect(
        isTermInOpeningWindow(startDateStr, new Date("2026-10-10T00:00:00"))
      ).toBe(true)
      expect(isTermEligibleForClassOpening).toBe(isTermEligibleForClassCreation)
    })
  })

  describe("isTermEligibleForClassCreation (mid-term empty term exception)", () => {
    const term = {
      startDate: "2026-10-15T00:00:00.000Z",
      endDate: "2026-12-15T00:00:00.000Z",
    }

    it("returns true during standard activation window regardless of classesCount", () => {
      // 3 days before startDate
      const beforeStart = new Date("2026-10-12T10:00:00")
      expect(
        isTermEligibleForClassCreation(
          { ...term, classesCount: 0 },
          beforeStart
        )
      ).toBe(true)
      expect(
        isTermEligibleForClassCreation(
          { ...term, classesCount: 5 },
          beforeStart
        )
      ).toBe(true)
      expect(isTermEligibleForClassCreation(term, beforeStart)).toBe(true)

      // 4 days after startDate
      const afterStartInWindow = new Date("2026-10-19T10:00:00")
      expect(
        isTermEligibleForClassCreation(
          { ...term, classesCount: 3 },
          afterStartInWindow
        )
      ).toBe(true)
    })

    it("returns false before activation date (now < startDate - 7d) even if classesCount is 0", () => {
      const tooEarly = new Date("2026-10-05T00:00:00") // 10 days before start
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: 0 }, tooEarly)
      ).toBe(false)
    })

    it("returns true when activation window has passed if term has 0 classes and now <= endDate", () => {
      // 20 days after start (activation window ended at day 7, term ends in December)
      const midTerm = new Date("2026-11-05T12:00:00")
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: 0 }, midTerm)
      ).toBe(true)

      // Exactly on the last moment of endDate
      const onEndOfDay = new Date("2026-12-15T23:59:59")
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: 0 }, onEndOfDay)
      ).toBe(true)
    })

    it("returns false when activation window has passed if term already has classes (> 0)", () => {
      const midTerm = new Date("2026-11-05T12:00:00")
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: 1 }, midTerm)
      ).toBe(false)
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: 8 }, midTerm)
      ).toBe(false)
    })

    it("treats omitted or null classesCount as 0 classes (allowed before endDate)", () => {
      const midTerm = new Date("2026-11-05T12:00:00")
      expect(isTermEligibleForClassCreation(term, midTerm)).toBe(true)
      expect(
        isTermEligibleForClassCreation({ ...term, classesCount: null }, midTerm)
      ).toBe(true)
    })

    it("returns false when current date is after term endDate even if classesCount is 0", () => {
      const afterTermEnded = new Date("2026-12-16T00:00:01")
      expect(
        isTermEligibleForClassCreation(
          { ...term, classesCount: 0 },
          afterTermEnded
        )
      ).toBe(false)
    })
  })
})
