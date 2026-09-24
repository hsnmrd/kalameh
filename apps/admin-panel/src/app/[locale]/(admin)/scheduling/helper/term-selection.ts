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
 * Selects the default scheduling term based on:
 * 1. Upcoming term starting within 10 days (0 <= startDate - now <= 10 days).
 * 2. Currently active/running term (startDate <= now <= endDate), if next term is > 10 days away.
 * 3. Fallback: closest future term, or most recently ended term if all have ended.
 */
export function selectDefaultSchedulingTerm(
  terms: SchedulingTermSummaryDto[] | undefined | null,
  now: Date = new Date()
): SchedulingTermSummaryDto | null {
  if (!terms || terms.length === 0) {
    return null
  }

  const nowMs = toStartOfDayMs(now)

  // Prioritize active terms, fallback to all terms if none are marked active
  const activeOnly = terms.filter((term) => term.isActive !== false)
  const candidateTerms = activeOnly.length > 0 ? activeOnly : terms

  // Sort ascending by startDate
  const sorted = [...candidateTerms].sort(
    (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
  )

  // 1. Check for upcoming terms starting within 10 days
  const upcomingTerms = sorted.filter(
    (term) => toStartOfDayMs(term.startDate) >= nowMs
  )

  const startingWithin10Days = upcomingTerms.find((term) => {
    const diffMs = toStartOfDayMs(term.startDate) - nowMs
    return diffMs >= 0 && diffMs <= TEN_DAYS_MS
  })

  if (startingWithin10Days) {
    return startingWithin10Days
  }

  // 2. Check for currently running term (next term is > 10 days away or doesn't exist)
  const runningTerm = sorted.find((term) => {
    const startMs = toStartOfDayMs(term.startDate)
    const endMs = toEndOfDayMs(term.endDate)
    return startMs <= nowMs && nowMs <= endMs
  })

  if (runningTerm) {
    return runningTerm
  }

  // 3. Fallback: closest upcoming term in the future
  if (upcomingTerms.length > 0) {
    return upcomingTerms[0]
  }

  // 4. Fallback: most recent term in the past
  return sorted[sorted.length - 1] ?? null
}
