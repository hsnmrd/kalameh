import { describe, expect, it } from "vitest"
import {
  isTermActiveNow,
  checkTermHasClasses,
  areActiveTermsHavingClasses,
} from "../utils"
import type { TermDto, ClassDto } from "@workspace/types"

describe("use-setup-flow-status utils", () => {
  const baseDate = new Date("2026-10-08T12:00:00Z")

  describe("isTermActiveNow", () => {
    it("returns false if isActive is false", () => {
      const term = {
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        isActive: false,
      } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(false)
    })

    it("returns true if term has no dates (loose mock fallback)", () => {
      const term = { isActive: true } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(true)
    })

    it("returns true if current date is within the term activation window [startDate - 7 days, endDate]", () => {
      // 5 days before startDate (activated)
      const term = {
        startDate: "2026-10-13",
        endDate: "2026-12-31",
        isActive: true,
      } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(true)
    })

    it("returns true if current date is within the ongoing term [startDate, endDate]", () => {
      const term = {
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        isActive: true,
      } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(true)
    })

    it("returns false if term has not yet activated (> 7 days before startDate)", () => {
      // 10 days before startDate
      const term = {
        startDate: "2026-10-19",
        endDate: "2026-12-31",
        isActive: true,
      } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(false)
    })

    it("returns false if term has expired past endDate", () => {
      const term = {
        startDate: "2026-06-01",
        endDate: "2026-09-30",
        isActive: true,
      } as TermDto
      expect(isTermActiveNow(term, baseDate)).toBe(false)
    })
  })

  describe("checkTermHasClasses", () => {
    it("returns true if term has classesCount > 0 from API", () => {
      const term = { id: "term-1", classesCount: 5 } as TermDto
      expect(checkTermHasClasses(term, [], 1, 0)).toBe(true)
    })

    it("returns false if term has classesCount === 0 and classes array is empty", () => {
      const term = { id: "term-1", classesCount: 0 } as TermDto
      expect(checkTermHasClasses(term, [], 1, 0)).toBe(false)
    })

    it("returns true if term has classesCount === 0 but classes array contains a matching class", () => {
      const term = { id: "term-1", classesCount: 0 } as TermDto
      const classes = [{ id: "c-1", termId: "term-1" }] as ClassDto[]
      expect(checkTermHasClasses(term, classes, 1, 0)).toBe(true)
    })

    it("returns false if classes array contains classes for other terms only", () => {
      const term = { id: "term-2", classesCount: 0 } as TermDto
      const classes = [{ id: "c-1", termId: "term-1" }] as ClassDto[]
      expect(checkTermHasClasses(term, classes, 1, 0)).toBe(false)
    })
  })

  describe("areActiveTermsHavingClasses", () => {
    it("returns false when active term has 0 classes even if past terms had classes", () => {
      const pastTerm = {
        id: "term-past",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        isActive: true,
        classesCount: 10,
      } as TermDto
      const activeTerm = {
        id: "term-active",
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        isActive: true,
        classesCount: 0,
      } as TermDto
      const classes = [{ id: "c-1", termId: "term-past" }] as ClassDto[]

      expect(
        areActiveTermsHavingClasses({
          terms: [pastTerm, activeTerm],
          classes,
          now: baseDate,
        })
      ).toBe(false)
    })

    it("returns true when all active terms have classes", () => {
      const activeTerm = {
        id: "term-active",
        startDate: "2026-10-01",
        endDate: "2026-12-31",
        isActive: true,
        classesCount: 2,
      } as TermDto
      const classes = [{ id: "c-1", termId: "term-active" }] as ClassDto[]

      expect(
        areActiveTermsHavingClasses({
          terms: [activeTerm],
          classes,
          now: baseDate,
        })
      ).toBe(true)
    })

    it("falls back to global classes existence when no terms are active", () => {
      const pastTerm = {
        id: "term-past",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        isActive: true,
        classesCount: 0,
      } as TermDto

      expect(
        areActiveTermsHavingClasses({
          terms: [pastTerm],
          classes: [{ id: "c-old" } as ClassDto],
          now: baseDate,
        })
      ).toBe(true)

      expect(
        areActiveTermsHavingClasses({
          terms: [pastTerm],
          classes: [],
          now: baseDate,
        })
      ).toBe(false)
    })
  })
})
