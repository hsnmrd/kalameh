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
  isActive = true,
  classesCount = 0
): SchedulingTermSummaryDto {
  return {
    id,
    title,
    startDate,
    endDate,
    isActive,
    classesCount,
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

  it("selects upcoming term within activation window (starts in 4 days <= 7 days)", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const term1 = makeTerm(
      "term-1",
      "Summer 2026",
      "2026-06-01T00:00:00Z", // ended, outside window
      "2026-09-10T23:59:59Z",
      true,
      2
    )
    const term2 = makeTerm(
      "term-2",
      "Fall 2026",
      "2026-09-28T00:00:00Z", // starts in 4 days (<= 7 days, within activation window)
      "2026-12-20T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm([term1, term2], now)
    expect(selected?.id).toBe("term-2")
  })

  it("selects active term within 7 days after start", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termRunningInWindow = makeTerm(
      "term-active-in-window",
      "Fall 2026",
      "2026-09-20T00:00:00Z", // started 4 days ago (<= 7 days)
      "2026-12-01T23:59:59Z"
    )
    const termNext = makeTerm(
      "term-next",
      "Winter 2026",
      "2026-12-15T00:00:00Z", // starts in 82 days (> 7 days)
      "2026-03-20T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm(
      [termRunningInWindow, termNext],
      now
    )
    expect(selected?.id).toBe("term-active-in-window")
  })

  it("returns null when no term is in activation window (past or distant future)", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termEnded = makeTerm(
      "term-ended",
      "Spring 2026",
      "2026-03-01T00:00:00Z",
      "2026-06-01T23:59:59Z",
      true,
      4
    )
    const termFuture1 = makeTerm(
      "term-future-1",
      "Winter 2026",
      "2026-11-01T00:00:00Z", // starts in 38 days (> 7 days)
      "2027-01-30T23:59:59Z"
    )

    const selected = selectDefaultSchedulingTerm([termEnded, termFuture1], now)
    expect(selected).toBeNull()
  })

  it("returns null when all terms are outside activation window and have classes", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termOld = makeTerm(
      "term-old",
      "Winter 2025",
      "2025-01-01T00:00:00Z",
      "2025-03-20T23:59:59Z",
      true,
      3
    )
    const termPastWindow = makeTerm(
      "term-past-window",
      "Summer 2026",
      "2026-09-01T00:00:00Z", // started 23 days ago (> 7 days post-start)
      "2026-11-30T23:59:59Z",
      true,
      2
    )

    const selected = selectDefaultSchedulingTerm([termOld, termPastWindow], now)
    expect(selected).toBeNull()
  })

  it("selects term whose activation window has passed if it has 0 classes and now <= endDate", () => {
    const now = new Date("2026-09-24T12:00:00Z")
    const termOld = makeTerm(
      "term-old",
      "Winter 2025",
      "2025-01-01T00:00:00Z",
      "2025-03-20T23:59:59Z",
      true,
      3
    )
    const termMidTermEmpty = makeTerm(
      "term-empty-mid-term",
      "Fall 2026",
      "2026-09-01T00:00:00Z", // started 23 days ago
      "2026-11-30T23:59:59Z",
      true,
      0
    )

    const selected = selectDefaultSchedulingTerm(
      [termOld, termMidTermEmpty],
      now
    )
    expect(selected?.id).toBe("term-empty-mid-term")
  })
})

describe("isTermEligibleForScheduling", () => {
  const now = new Date("2026-09-24T12:00:00Z")

  it("returns true for a term starting within 7 days (e.g. 4 days away)", () => {
    const term = makeTerm(
      "term-soon",
      "Fall 2026",
      "2026-09-28T00:00:00Z", // starts in 4 days
      "2026-12-20T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns true on exact 7 days before start", () => {
    const term = makeTerm(
      "term-boundary",
      "Fall 2026",
      "2026-10-01T12:00:00Z", // starts in 7 days
      "2026-12-20T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns true within 7 days after start date", () => {
    const term = makeTerm(
      "term-post-start-in-window",
      "Fall 2026",
      "2026-09-20T00:00:00Z", // started 4 days ago
      "2026-12-20T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns false for a term starting in more than 7 days (e.g. 10 days away)", () => {
    const term = makeTerm(
      "term-distant",
      "Winter 2026",
      "2026-10-05T00:00:00Z", // starts in 11 days
      "2027-01-15T23:59:59Z"
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(false)
  })

  it("returns false for a term whose activation window has passed (> 7 days after start) when it has classes", () => {
    const term = makeTerm(
      "term-activation-passed",
      "Summer 2026",
      "2026-09-10T00:00:00Z", // started 14 days ago (> 7 days)
      "2026-11-20T23:59:59Z",
      true,
      3
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(false)
  })

  it("returns true for a term whose activation window has passed if it has 0 classes and now <= endDate", () => {
    const term = makeTerm(
      "term-mid-term-empty",
      "Summer 2026",
      "2026-09-10T00:00:00Z", // started 14 days ago (> 7 days)
      "2026-11-20T23:59:59Z",
      true,
      0
    )
    expect(isTermEligibleForScheduling(term, now)).toBe(true)
  })

  it("returns false for an inactive term even if dates are inside activation window", () => {
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
