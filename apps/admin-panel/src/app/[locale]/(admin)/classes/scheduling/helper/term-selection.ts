import {
  isTermEligibleForClassCreation,
  type SchedulingTermSummaryDto,
} from "@workspace/types"

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
 * 2. Must be within the term activation window ([startDate - 7 days, startDate + 7 days])
 *    OR have 0 classes and current date is on/before term endDate.
 */
export function isTermEligibleForScheduling(
  term: Pick<SchedulingTermSummaryDto, "startDate" | "endDate" | "isActive"> & {
    classesCount?: number | null
  },
  now: Date = new Date()
): boolean {
  if (term.isActive === false) {
    return false
  }

  return isTermEligibleForClassCreation(
    {
      startDate: term.startDate,
      endDate: term.endDate,
      classesCount: term.classesCount,
    },
    now
  )
}

/**
 * Selects the default scheduling term based on:
 * Terms within their activation window ([startDate - 7 days, startDate + 7 days]).
 * If multiple eligible terms exist, returns the earliest starting eligible term.
 * If no eligible term exists, returns null.
 */
export function selectDefaultSchedulingTerm(
  terms: SchedulingTermSummaryDto[] | undefined | null,
  now: Date = new Date()
): SchedulingTermSummaryDto | null {
  if (!terms || terms.length === 0) {
    return null
  }

  // Only consider eligible terms (within activation window)
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

  return sorted[0] ?? null
}
