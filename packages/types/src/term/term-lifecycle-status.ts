export type TermLifecycleStatus =
  "ACTIVE" | "REGISTERING" | "UPCOMING" | "COMPLETED" | "INACTIVE"

export interface TermLifecycleSubject {
  id?: string
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  operatingPhaseId?: string | null
  lifecycleStatus?: TermLifecycleStatus
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

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Calculates the dynamic lifecycle status of a term:
 * - INACTIVE: Term is disabled (isActive === false)
 * - COMPLETED: Term end date has passed (now > endDate)
 * - ACTIVE: Currently ongoing (startDate <= now <= endDate)
 * - REGISTERING: Upcoming immediate next term in gap between terms or within 1 week before start
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
      // When now is in the gap after previous term ended OR within 7 days before start: REGISTERING
      if (isNormalGap) {
        if (nowMs > prevEndMs || nowMs >= startMs - SEVEN_DAYS_MS) {
          return "REGISTERING"
        }
        return "UPCOMING"
      }

      // If gap is longer than 30 days or non-existent:
      // When within 1 week (7 days) before start: REGISTERING
      if (nowMs >= startMs - SEVEN_DAYS_MS) {
        return "REGISTERING"
      }
      return "UPCOMING"
    }

    // If no previous term exists, apply the 1-week rule
    if (nowMs >= startMs - SEVEN_DAYS_MS) {
      return "REGISTERING"
    }
    return "UPCOMING"
  }

  // Fallback when no sibling terms are provided
  if (nowMs >= startMs - SEVEN_DAYS_MS) {
    return "REGISTERING"
  }
  return "UPCOMING"
}

/**
 * Checks whether a term can be deleted:
 * Deletion is accessible ONLY for "پیش‌رو" (UPCOMING) terms whose start date has not reached yet (now < startDate).
 */
export function isTermDeletable(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  now: Date = new Date()
): boolean {
  const nowMs = toStartOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)

  // Start date has already reached or passed: NEVER deletable
  if (nowMs >= startMs) {
    return false
  }

  // If sibling terms are provided, calculate lifecycle status: must be strictly UPCOMING
  if (siblingTerms && siblingTerms.length > 0) {
    const status = calculateTermLifecycleStatus(term, siblingTerms, now)
    return status === "UPCOMING"
  }

  // If term has lifecycleStatus already calculated on it
  if (term.lifecycleStatus) {
    return term.lifecycleStatus === "UPCOMING"
  }

  // Fallback when no sibling terms or lifecycleStatus provided:
  // Must be in the future (nowMs < startMs) and active
  return term.isActive !== false
}
