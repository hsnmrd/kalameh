import { describe, expect, it } from "vitest"
import type { SchedulingTermSummaryDto } from "@workspace/types"
import {
  isTermEligibleForScheduling,
  selectDefaultSchedulingTerm,
} from "../helper/term-selection"

function makeTerm(
  id: string,
  title: string,
  startDate: string,
  endDate: string,
  isActive = true
): SchedulingTermSummaryDto {
  return {
    id,
    title,
    startDate,
    endDate,
    isActive,
    classesCount: 0,
    requirementsCount: 0,
    totalRequiredClasses: 0,
    schedulingStatus: "READY_TO_SCHEDULE",
  }
}

describe("selectDefaultSchedulingTerm", () => {
  it("returns null when terms array is empty or undefined", () => {
    expect(selectDefaultSchedulingTerm([])).toBeNull()
    expect(selectDefaultSchedulingTerm(null)).toBeNull()
    expect(selectDefaultSchedulingTerm(undefined)).toBeNull()
  })

  it("selects upcoming term starting within 10 days", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const term1 = makeTerm(
      "term-1",
      "Summer 2026",
      "2026-06-01T00:00:00Z",
      "2026-09-20T23:59:59Z"
    )
    const term2 = makeTerm(
      "term-2",
      "Fall 2026",
      "2026-09-28T00:00:00Z", // starts in 4 days (<= 10 days)
      "2026-12-20T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm([term1, term2], now)
    expect(selected?.id).toBe("term-2")
  })

  it("selects running term when next term is more than 10 days away (gap scenario)", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termRunning = makeTerm(
      "term-running",
      "Fall 2026",
      "2026-09-01T00:00:00Z",
      "2026-12-01T23:59:59Z"
    )
    const termNext = makeTerm(
      "term-next",
      "Winter 2026",
      "2026-12-15T00:00:00Z", // starts in 82 days (> 10 days)
      "2026-03-20T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm([termRunning, termNext], now)
    expect(selected?.id).toBe("term-running")
  })

  it("switches to upcoming term 10 days before it starts even if previous term is still running", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termEndingSoon = makeTerm(
      "term-ending",
      "Summer 2026",
      "2026-06-01T00:00:00Z",
      "2026-09-26T23:59:59Z" // still running for 2 days
    )
    const termStartingSoon = makeTerm(
      "term-starting",
      "Fall 2026",
      "2026-10-01T00:00:00Z", // starts in 7 days (<= 10 days)
      "2026-12-25T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm(
      [termEndingSoon, termStartingSoon],
      now
    )
    expect(selected?.id).toBe("term-starting")
  })

  it("returns null when no term is running and next term starts in more than 10 days", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termEnded = makeTerm(
      "term-ended",
      "Spring 2026",
      "2026-03-01T00:00:00Z",
      "2026-06-01T23:59:59Z"
    )
    const termFuture1 = makeTerm(
      "term-future-1",
      "Winter 2026",
      "2026-11-01T00:00:00Z", // starts in 38 days (> 10 days)
      "2027-01-30T23:59:59Z"
    )
    const termFuture2 = makeTerm(
      "term-future-2",
      "Spring 2027",
      "2027-03-01T00:00:00Z",
      "2027-06-01T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm(
      [termEnded, termFuture2, termFuture1],
      now
    )
    expect(selected).toBeNull()
  })

  it("returns null when all terms are in the past", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termOld = makeTerm(
      "term-old",
      "Winter 2025",
      "2025-01-01T00:00:00Z",
      "2025-03-20T23:59:59Z"
    )
    const termRecent = makeTerm(
      "term-recent",
      "Summer 2026",
      "2026-06-01T00:00:00Z",
      "2026-08-31T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm([termOld, termRecent], now)
    expect(selected).toBeNull()
  })
})

describe("isTermEligibleForScheduling", () => {
  const now = new Date("2026-09-24T12:00:00Z")

  it("returns true for a term starting within 10 days", () => {
    const term = makeTerm(
      "term-soon",
      "Fall 2026",
      "2026-09-28T00:00:00Z", // starts in 4 days
      "2026-12-20T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns true for a currently running term", () => {
    const term = makeTerm(
      "term-running",
      "Summer 2026",
      "2026-09-01T00:00:00Z",
      "2026-10-15T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns false for a term starting in more than 10 days", () => {
    const term = makeTerm(
      "term-distant",
      "Winter 2026",
      "2026-10-10T00:00:00Z", // starts in 16 days
      "2027-01-15T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(false)
  })

  it("returns false for a term that has already ended", () => {
    const term = makeTerm(
      "term-past",
      "Summer 2026",
      "2026-06-01T00:00:00Z",
      "2026-09-20T23:59:59Z" // ended 4 days ago
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(false)
  })

  it("returns false for an inactive term even if dates match", () => {
    const term = makeTerm(
      "term-inactive",
      "Fall 2026",
      "2026-09-28T00:00:00Z",
      "2026-12-20T23:59:59Z",
      false
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(false)
  })
})
