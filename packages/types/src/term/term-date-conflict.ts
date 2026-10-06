import { parseInputDate, toIsoDate } from "./term-session-calculator.js"

export interface TermDateEntity {
  id?: string
  title?: string
  startDate: string | Date
  endDate: string | Date
  operatingPhaseId?: string
}

/**
 * Normalizes a date representation (Date, ISO string, or Jalali string)
 * to an ISO YYYY-MM-DD calendar day string.
 */
export function normalizeCalendarDate(input?: string | Date | null): string {
  if (!input) return ""
  return toIsoDate(parseInputDate(input))
}

/**
 * Checks whether two terms have a date conflict (overlap / sharing same calendar days).
 * Two terms conflict if there exists at least one calendar day (day, month, year)
 * that falls within both term boundaries inclusive.
 * In calendar arithmetic: startA <= endB && startB <= endA
 */
export function hasTermDateConflict(
  termA: { startDate?: string | Date | null; endDate?: string | Date | null },
  termB: { startDate?: string | Date | null; endDate?: string | Date | null }
): boolean {
  if (
    !termA.startDate ||
    !termA.endDate ||
    !termB.startDate ||
    !termB.endDate
  ) {
    return false
  }
  const startA = normalizeCalendarDate(termA.startDate)
  const endA = normalizeCalendarDate(termA.endDate)
  const startB = normalizeCalendarDate(termB.startDate)
  const endB = normalizeCalendarDate(termB.endDate)

  if (!startA || !endA || !startB || !endB) {
    return false
  }

  return startA <= endB && startB <= endA
}

/**
 * Returns the overlapping date range between two terms, or null if they do not overlap.
 */
export function getOverlappingDateRange(
  termA: { startDate: string | Date; endDate: string | Date },
  termB: { startDate: string | Date; endDate: string | Date }
): { overlapStart: string; overlapEnd: string } | null {
  const startA = normalizeCalendarDate(termA.startDate)
  const endA = normalizeCalendarDate(termA.endDate)
  const startB = normalizeCalendarDate(termB.startDate)
  const endB = normalizeCalendarDate(termB.endDate)

  if (startA <= endB && startB <= endA) {
    const overlapStart = startA > startB ? startA : startB
    const overlapEnd = endA < endB ? endA : endB
    return { overlapStart, overlapEnd }
  }
  return null
}

/**
 * Checks whether any two terms within a collection have overlapping dates / same days.
 */
export function checkTermsDateOverlap<
  T extends {
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  },
>(terms: T[]): { hasConflict: boolean; conflictingPair?: [T, T] } {
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const termA = terms[i]!
      const termB = terms[j]!
      if (termA.id && termB.id && termA.id === termB.id) continue
      if (hasTermDateConflict(termA, termB)) {
        return { hasConflict: true, conflictingPair: [termA, termB] }
      }
    }
  }
  return { hasConflict: false }
}

/**
 * Finds all terms in `otherTerms` that have a date conflict with `targetTerm`.
 */
export function findTermDateConflicts<
  T extends {
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  },
>(targetTerm: T, otherTerms: T[]): T[] {
  return otherTerms.filter((other) => {
    if (targetTerm.id && other.id && targetTerm.id === other.id) {
      return false
    }
    return hasTermDateConflict(targetTerm, other)
  })
}
