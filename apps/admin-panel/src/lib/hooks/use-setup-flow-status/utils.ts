import { isTermActivated, type TermDto, type ClassDto } from "@workspace/types"

function toEndOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Checks whether a term is currently active:
 * 1. Must be enabled (isActive !== false).
 * 2. If dates are provided, must be within the activation period
 *    (activated at startDate - 7 days and not expired past endDate).
 * 3. Gracefully falls back to true if dates are omitted (e.g. simplified mocks).
 */
export function isTermActiveNow(
  term: Pick<TermDto, "startDate" | "endDate" | "isActive">,
  now: Date = new Date()
): boolean {
  if (term.isActive === false) return false
  if (!term.startDate || !term.endDate) return true

  const isActivated = isTermActivated(term.startDate, now)
  const isBeforeOrOnEndDate =
    now.getTime() <= toEndOfDay(term.endDate).getTime()

  return isActivated && isBeforeOrOnEndDate
}

/**
 * Checks whether a given term has any registered classes:
 * - Checks the term's own classesCount property from API.
 * - Checks the classes array for classes matching this term's id.
 * - Handles single-term mock fallbacks if classesCount is undefined.
 */
export function checkTermHasClasses(
  term: TermDto,
  classes: ClassDto[] = [],
  activeTermsCount = 1,
  fallbackClassesCount = 0
): boolean {
  if (typeof term.classesCount === "number") {
    if (term.classesCount > 0) return true
    return classes.some((c) => c.termId === term.id)
  }

  const matchingClasses = classes.filter((c) =>
    c.termId ? c.termId === term.id : activeTermsCount === 1
  )
  if (matchingClasses.length > 0) {
    return true
  }

  if (activeTermsCount === 1 && fallbackClassesCount > 0) {
    return true
  }

  return false
}

export interface AreActiveTermsHavingClassesParams {
  terms: TermDto[]
  classes: ClassDto[]
  fallbackClassesCount?: number
  now?: Date
}

/**
 * Evaluates whether all currently active terms have classes.
 * If at least one active term exists, every active term must have classes.
 * If no active terms exist (e.g. between terms or before creation),
 * falls back to checking whether any classes exist across the institute.
 */
export function areActiveTermsHavingClasses({
  terms,
  classes,
  fallbackClassesCount = 0,
  now = new Date(),
}: AreActiveTermsHavingClassesParams): boolean {
  const activeTerms = terms.filter((term) => isTermActiveNow(term, now))

  if (activeTerms.length > 0) {
    return activeTerms.every((term) =>
      checkTermHasClasses(
        term,
        classes,
        activeTerms.length,
        fallbackClassesCount
      )
    )
  }

  return classes.length > 0 || fallbackClassesCount > 0
}
