import type { SchedulingTermSummaryDto } from "@workspace/types"

export const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000

export function toStartOfDayMs(date: Date | string): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function toEndOfDayMs(date: Date | string): number {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/**
 * Determines whether a term is eligible for scheduling:
 * 1. Must be active (term.isActive !== false).
 * 2. Either starts within 10 days in the future (0 <= startDate - now <= 10 days) and has not ended,
 *    OR is currently running (startDate <= now <= endDate).
 * Terms starting > 10 days in the future or terms that have ended are NOT eligible.
 */
export function isTermEligibleForScheduling(
  term: Pick<SchedulingTermSummaryDto, "startDate" | "endDate" | "isActive">,
  now: Date = new Date()
): boolean {
  if (term.isActive === false) {
    return false
  }

  const nowStartMs = toStartOfDayMs(now)
  const nowEndMs = toEndOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)
  const endMs = toEndOfDayMs(term.endDate)

  // 1. Starts within 10 days (0 <= startDate - now <= 10 days) and hasn't ended
  const diffMs = startMs - nowStartMs
  if (diffMs >= 0 && diffMs <= TEN_DAYS_MS && nowStartMs <= endMs) {
    return true
  }

  // 2. Currently running (has already started and not ended)
  if (startMs <= nowEndMs && nowStartMs <= endMs) {
    return true
  }

  return false
}

/**
 * Selects the default scheduling term based on:
 * 1. Upcoming term starting within 10 days (0 <= startDate - now <= 10 days).
 * 2. Currently active/running term (startDate <= now <= endDate).
 * If no eligible term exists, returns null.
 */
export function selectDefaultSchedulingTerm(
  terms: SchedulingTermSummaryDto[] | undefined | null,
  now: Date = new Date()
): SchedulingTermSummaryDto | null {
  if (!terms || terms.length === 0) {
    return null
  }

  const nowMs = toStartOfDayMs(now)

  // Only consider eligible terms (starts within 10 days or currently running)
  const eligibleTerms = terms.filter((term) =>
    isTermEligibleForScheduling(term, now)
  )

  if (eligibleTerms.length === 0) {
    return null
  }

  // Sort ascending by startDate
  const sorted = [...eligibleTerms].sort(
    (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
  )

  // 1. Check for upcoming terms starting within 10 days
  const startingWithin10Days = sorted.find((term) => {
    const diffMs = toStartOfDayMs(term.startDate) - nowMs
    return diffMs >= 0 && diffMs <= TEN_DAYS_MS
  })

  if (startingWithin10Days) {
    return startingWithin10Days
  }

  // 2. Check for currently running term
  const runningTerm = sorted.find((term) => {
    const startMs = toStartOfDayMs(term.startDate)
    const endMs = toEndOfDayMs(term.endDate)
    return startMs <= nowMs && nowMs <= endMs
  })

  if (runningTerm) {
    return runningTerm
  }

  return null
}
