import { getTermActivationDate } from "./term-activation-window.js"

export type TermLifecycleStatus =
  "ACTIVE" | "REGISTERING" | "UPCOMING" | "COMPLETED" | "INACTIVE"

export interface TermLifecycleSubject {
  id?: string
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  operatingPhaseId?: string | null
  lifecycleStatus?: TermLifecycleStatus
  studentCount?: number
  studentsCount?: number
  hasStudents?: boolean
  classesCount?: number
}

function toStartOfDayMs(date: Date | string): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function toEndOfDayMs(date: Date | string): number {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/**
 * Calculates the dynamic lifecycle status of a term:
 * - INACTIVE: Term is disabled (isActive === false)
 * - COMPLETED: Term end date has passed (now > endDate)
 * - ACTIVE: Currently ongoing (startDate <= now <= endDate)
 * - REGISTERING: Upcoming immediate next term in gap between terms or within 1 week before start (activation date)
 * - UPCOMING: Future term whose registration has not yet opened
 */
export function calculateTermLifecycleStatus(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  now: Date = new Date()
): TermLifecycleStatus {
  if (!term.isActive) {
    return "INACTIVE"
  }

  const nowMs = toStartOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)
  const endMs = toEndOfDayMs(term.endDate)
  const activationMs = getTermActivationDate(term.startDate).getTime()

  if (nowMs > endMs) {
    return "COMPLETED"
  }

  if (nowMs >= startMs && nowMs <= endMs) {
    return "ACTIVE"
  }

  // At this point, nowMs < startMs (the term is in the future).
  if (siblingTerms && siblingTerms.length > 0) {
    const targetPhaseId = term.operatingPhaseId ?? null

    // Filter active sibling terms belonging to the same operating phase (or general)
    const activeSiblings = siblingTerms
      .filter(
        (s) =>
          s.isActive !== false && (s.operatingPhaseId ?? null) === targetPhaseId
      )
      .sort((a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate))

    // Find future terms in this sequence
    const futureSiblings = activeSiblings.filter(
      (s) => toStartOfDayMs(s.startDate) > nowMs
    )

    // Only the immediate next upcoming term can be in "REGISTERING" status
    const immediateNext = futureSiblings[0]
    const isImmediateNext =
      immediateNext &&
      (term.id && immediateNext.id
        ? term.id === immediateNext.id
        : toStartOfDayMs(term.startDate) ===
          toStartOfDayMs(immediateNext.startDate))

    if (!isImmediateNext) {
      return "UPCOMING"
    }

    // Find the term preceding this immediate next term
    const targetIdx = activeSiblings.findIndex((s) =>
      term.id && s.id
        ? s.id === term.id
        : toStartOfDayMs(s.startDate) === startMs
    )
    const prevTerm = targetIdx > 0 ? activeSiblings[targetIdx - 1] : undefined

    if (prevTerm) {
      const prevEndMs = toEndOfDayMs(prevTerm.endDate)
      const gapMs = startMs - prevEndMs
      const isNormalGap = gapMs > 0 && gapMs <= 30 * 24 * 60 * 60 * 1000

      // If there is a normal inter-term gap (up to 30 days):
      // When now is in the gap after previous term ended OR within 7 days before start (activation date): REGISTERING
      if (isNormalGap) {
        if (nowMs > prevEndMs || nowMs >= activationMs) {
          return "REGISTERING"
        }
        return "UPCOMING"
      }

      // If gap is longer than 30 days or non-existent:
      // When within 7 days before start (activation date): REGISTERING
      if (nowMs >= activationMs) {
        return "REGISTERING"
      }
      return "UPCOMING"
    }

    // If no previous term exists, apply the 7-day pre-start rule (activation date)
    if (nowMs >= activationMs) {
      return "REGISTERING"
    }
    return "UPCOMING"
  }

  // Fallback when no sibling terms are provided
  if (nowMs >= activationMs) {
    return "REGISTERING"
  }
  return "UPCOMING"
}

/**
 * Checks whether a term can be deleted:
 * A term can be deleted if its start date has not reached yet (now < startDate)
 * and it does not have any registered/enrolled students yet.
 */
export function isTermDeletable(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  now: Date = new Date()
): boolean {
  void siblingTerms

  const nowMs = toStartOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)

  // Start date has already reached or passed: NEVER deletable
  if (nowMs >= startMs) {
    return false
  }

  // If student count is provided and greater than 0: cannot delete
  const studentCount = term.studentsCount ?? term.studentCount
  if (typeof studentCount === "number" && studentCount > 0) {
    return false
  }

  // If hasStudents flag is explicitly true: cannot delete
  if (term.hasStudents === true) {
    return false
  }

  // Term is upcoming or registering and does not have any students yet
  return term.isActive !== false
}

/**
 * Finds the currently active term for an institute from a list of terms:
 * 1. An ongoing term (lifecycleStatus "ACTIVE" or startDate <= now <= endDate, isActive !== false).
 *    If multiple, returns the earliest starting ongoing term.
 * 2. An immediate registering term (lifecycleStatus "REGISTERING" or within activation window).
 * 3. The nearest upcoming term (startDate > now, isActive !== false).
 * 4. If all terms are completed/inactive, returns null.
 */
export function findCurrentActiveTerm<T extends TermLifecycleSubject>(
  terms: T[] | undefined | null,
  now: Date = new Date()
): T | null {
  if (!terms || terms.length === 0) {
    return null
  }

  const enabledTerms = terms.filter((t) => t.isActive !== false)
  if (enabledTerms.length === 0) {
    return null
  }

  // 1. Look for a currently ongoing term ("ACTIVE")
  const activeTerms = enabledTerms.filter((term) => {
    const status =
      term.lifecycleStatus ??
      calculateTermLifecycleStatus(term, enabledTerms, now)
    return status === "ACTIVE"
  })

  if (activeTerms.length > 0) {
    return (
      [...activeTerms].sort(
        (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
      )[0] ?? null
    )
  }

  // 2. Look for an immediate registering term ("REGISTERING")
  const registeringTerms = enabledTerms.filter((term) => {
    const status =
      term.lifecycleStatus ??
      calculateTermLifecycleStatus(term, enabledTerms, now)
    return status === "REGISTERING"
  })

  if (registeringTerms.length > 0) {
    return (
      [...registeringTerms].sort(
        (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
      )[0] ?? null
    )
  }

  // 3. Look for the nearest upcoming term ("UPCOMING")
  const upcomingTerms = enabledTerms.filter((term) => {
    const status =
      term.lifecycleStatus ??
      calculateTermLifecycleStatus(term, enabledTerms, now)
    return status === "UPCOMING"
  })

  if (upcomingTerms.length > 0) {
    return (
      [...upcomingTerms].sort(
        (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
      )[0] ?? null
    )
  }

  // 4. All terms are completed or inactive
  return null
}
