import { getTermActivationDate } from "./term-activation-window.js"

export type TermLifecycleStatus =
  | "ACTIVE"
  | "ONGOING"
  | "REGISTERING"
  | "CLASSES_STARTED"
  | "FINAL_EXAMS"
  | "GRADING"
  | "UPCOMING"
  | "COMPLETED"
  | "INACTIVE"

export interface TermLifecycleSettings {
  registrationDaysBeforeStart?: number
  registrationDaysAfterStart?: number
  examDaysBeforeEnd?: number
}

export const DEFAULT_TERM_LIFECYCLE_SETTINGS: Required<TermLifecycleSettings> =
  {
    registrationDaysBeforeStart: 10,
    registrationDaysAfterStart: 7,
    examDaysBeforeEnd: 2,
  }

export interface TermLifecycleSubject {
  id?: string
  startDate: Date | string
  endDate: Date | string
  isActive: boolean
  operatingPhaseId?: string | null
  lifecycleStatus?: TermLifecycleStatus
  lifecycleStatuses?: TermLifecycleStatus[]
  studentCount?: number
  studentsCount?: number
  hasStudents?: boolean
  classesCount?: number
  allScoresSet?: boolean
  scoresFinalizedAt?: Date | string | null
  unscoredStudentsCount?: number
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

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
 * Checks if a term has all student scores finalized.
 */
function areScoresFinalized(term: TermLifecycleSubject): boolean {
  if (term.scoresFinalizedAt != null) return true
  if (term.allScoresSet === true) return true
  if (term.allScoresSet === false) return false
  if (typeof term.unscoredStudentsCount === "number") {
    return term.unscoredStudentsCount === 0
  }
  const studentCount = term.studentsCount ?? term.studentCount
  if (typeof studentCount === "number" && studentCount > 0) {
    return false
  }
  if (term.hasStudents === true) {
    return false
  }
  return true
}

/**
 * Calculates ALL active statuses for a term simultaneously (Multiple Statuses):
 * 1. INACTIVE: When isActive is false
 * 2. Post-term (now > endDate):
 *    - GRADING: When scores of students have NOT yet been completely set
 *    - COMPLETED: When term endDate passed AND all scores are set
 * 3. During term (startDate <= now <= endDate):
 *    - ONGOING / ACTIVE: Main status throughout term
 *    - CLASSES_STARTED: Within the first N days of term (default 7 days)
 *    - REGISTERING: During late registration window (first N days of term)
 *    - FINAL_EXAMS: During the last M days of term (default 2 days)
 * 4. Pre-term (now < startDate):
 *    - REGISTERING: For the immediate next term when within X days before start (default 10 days) or inside gap
 *    - UPCOMING: For subsequent terms or when registration is not yet open
 */
export function calculateTermLifecycleStatuses(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  settings?: TermLifecycleSettings,
  now: Date = new Date()
): TermLifecycleStatus[] {
  if (!term.isActive) {
    return ["INACTIVE"]
  }

  const cfg = {
    registrationDaysBeforeStart:
      settings?.registrationDaysBeforeStart ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.registrationDaysBeforeStart,
    registrationDaysAfterStart:
      settings?.registrationDaysAfterStart ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.registrationDaysAfterStart,
    examDaysBeforeEnd:
      settings?.examDaysBeforeEnd ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.examDaysBeforeEnd,
  }
  const nowMs = toStartOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)
  const endMs = toEndOfDayMs(term.endDate)
  const regBeforeMs = cfg.registrationDaysBeforeStart * ONE_DAY_MS
  const regAfterMs = cfg.registrationDaysAfterStart * ONE_DAY_MS
  const examBeforeMs = cfg.examDaysBeforeEnd * ONE_DAY_MS

  // 1. Post-term
  if (nowMs > endMs) {
    if (areScoresFinalized(term)) {
      return ["COMPLETED"]
    }
    return ["GRADING"]
  }

  // 2. During term
  if (nowMs >= startMs && nowMs <= endMs) {
    const statuses: TermLifecycleStatus[] = ["ACTIVE", "ONGOING"]

    const hasNoClasses = term.classesCount === 0
    const commencementEndMs = toEndOfDayMs(new Date(startMs + regAfterMs))

    // Classes started: only if classes exist in the term and within commencement window
    if (nowMs <= commencementEndMs && !hasNoClasses) {
      statuses.push("CLASSES_STARTED")
    }

    // Registration window:
    // 1. Within the first N days of classes (Classes started + Late registration)
    // 2. OR if start date / registering time has passed but there are NO classes in the term yet (classesCount === 0),
    //    the term continues to contain signup status (REGISTERING) so students can still sign up and be contained in the term!
    if (nowMs <= commencementEndMs || hasNoClasses) {
      statuses.push("REGISTERING")
    }

    // Final exam window (last M days) - only if classes exist in the term
    const examStartMs = toStartOfDayMs(new Date(endMs - examBeforeMs))
    if (nowMs >= examStartMs && !hasNoClasses) {
      statuses.push("FINAL_EXAMS")
    }

    return statuses
  }

  // 3. Pre-term (nowMs < startMs)
  if (siblingTerms && siblingTerms.length > 0) {
    const targetPhaseId = term.operatingPhaseId ?? null

    const activeSiblings = siblingTerms
      .filter(
        (s) =>
          s.isActive !== false && (s.operatingPhaseId ?? null) === targetPhaseId
      )
      .sort((a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate))

    const futureSiblings = activeSiblings.filter(
      (s) => toStartOfDayMs(s.startDate) > nowMs
    )

    const immediateNext = futureSiblings[0]
    const isImmediateNext =
      immediateNext &&
      (term.id && immediateNext.id
        ? term.id === immediateNext.id
        : toStartOfDayMs(term.startDate) ===
          toStartOfDayMs(immediateNext.startDate))

    if (!isImmediateNext) {
      return ["UPCOMING"]
    }

    const targetIdx = activeSiblings.findIndex((s) =>
      term.id && s.id
        ? s.id === term.id
        : toStartOfDayMs(s.startDate) === startMs
    )
    const prevTerm = targetIdx > 0 ? activeSiblings[targetIdx - 1] : undefined

    const activationMs = getTermActivationDate(term.startDate).getTime()
    const customRegStartMs = startMs - regBeforeMs
    const effectiveRegStartMs = Math.min(activationMs, customRegStartMs)

    if (prevTerm) {
      const prevEndMs = toEndOfDayMs(prevTerm.endDate)
      const gapMs = startMs - prevEndMs
      const isNormalGap = gapMs > 0 && gapMs <= 30 * ONE_DAY_MS

      if (isNormalGap && (nowMs > prevEndMs || nowMs >= effectiveRegStartMs)) {
        return ["REGISTERING"]
      }

      if (nowMs >= effectiveRegStartMs) {
        return ["REGISTERING"]
      }
      return ["UPCOMING"]
    }

    if (nowMs >= effectiveRegStartMs) {
      return ["REGISTERING"]
    }
    return ["UPCOMING"]
  }

  // Fallback when no sibling terms are passed
  const activationMs = getTermActivationDate(term.startDate).getTime()
  const customRegStartMs = startMs - regBeforeMs
  const effectiveRegStartMs = Math.min(activationMs, customRegStartMs)

  if (nowMs >= effectiveRegStartMs) {
    return ["REGISTERING"]
  }
  return ["UPCOMING"]
}

/**
 * Calculates the primary lifecycle status of a term (backward-compatible single status).
 */
export function calculateTermLifecycleStatus(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  settingsOrNow?: TermLifecycleSettings | Date,
  maybeNow?: Date
): TermLifecycleStatus {
  const settings: TermLifecycleSettings | undefined =
    settingsOrNow instanceof Date ? undefined : settingsOrNow
  const now: Date =
    settingsOrNow instanceof Date
      ? settingsOrNow
      : maybeNow instanceof Date
        ? maybeNow
        : new Date()

  const statuses = calculateTermLifecycleStatuses(
    term,
    siblingTerms,
    settings,
    now
  )

  if (statuses.includes("INACTIVE")) return "INACTIVE"
  if (statuses.includes("GRADING")) return "GRADING"
  if (statuses.includes("COMPLETED")) return "COMPLETED"
  if (statuses.includes("ACTIVE")) return "ACTIVE"
  if (statuses.includes("REGISTERING")) return "REGISTERING"
  return "UPCOMING"
}

export function isTermRegistrationOpen(
  term: TermLifecycleSubject,
  siblingTerms?: TermLifecycleSubject[],
  settings?: TermLifecycleSettings,
  now: Date = new Date()
): boolean {
  const statuses = calculateTermLifecycleStatuses(
    term,
    siblingTerms,
    settings,
    now
  )
  return statuses.includes("REGISTERING")
}

export function isTermOngoing(
  term: TermLifecycleSubject,
  now: Date = new Date()
): boolean {
  if (!term.isActive) return false
  const nowMs = toStartOfDayMs(now)
  const startMs = toStartOfDayMs(term.startDate)
  const endMs = toEndOfDayMs(term.endDate)
  return nowMs >= startMs && nowMs <= endMs
}

export function isTermInCommencement(
  term: TermLifecycleSubject,
  settings?: TermLifecycleSettings,
  now: Date = new Date()
): boolean {
  const statuses = calculateTermLifecycleStatuses(
    term,
    undefined,
    settings,
    now
  )
  return statuses.includes("CLASSES_STARTED")
}

export function isTermInFinalExams(
  term: TermLifecycleSubject,
  settings?: TermLifecycleSettings,
  now: Date = new Date()
): boolean {
  const statuses = calculateTermLifecycleStatuses(
    term,
    undefined,
    settings,
    now
  )
  return statuses.includes("FINAL_EXAMS")
}

export function isTermInGrading(
  term: TermLifecycleSubject,
  now: Date = new Date()
): boolean {
  const statuses = calculateTermLifecycleStatuses(
    term,
    undefined,
    undefined,
    now
  )
  return statuses.includes("GRADING")
}

export function isTermCompleted(
  term: TermLifecycleSubject,
  now: Date = new Date()
): boolean {
  const statuses = calculateTermLifecycleStatuses(
    term,
    undefined,
    undefined,
    now
  )
  return statuses.includes("COMPLETED")
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

export interface ClosestSignupTermResult<
  T extends TermLifecycleSubject = TermLifecycleSubject,
> {
  term: T | null
  isRegistrationOpen: boolean
  daysUntilRegistration?: number
  daysUntilEndRegistration?: number
}

/**
 * Finds the closest term regarding student registration:
 * 1. An active term currently open for registration ("REGISTERING").
 * 2. If no term is registering, the nearest upcoming term that will open registration next.
 * 3. Returns null if no active or upcoming term exists.
 */
export function findClosestSignupTerm<T extends TermLifecycleSubject>(
  terms: T[] | undefined | null,
  settings?: TermLifecycleSettings,
  now: Date = new Date()
): ClosestSignupTermResult<T> {
  if (!terms || terms.length === 0) {
    return { term: null, isRegistrationOpen: false }
  }

  const enabledTerms = terms.filter((t) => t.isActive !== false)
  if (enabledTerms.length === 0) {
    return { term: null, isRegistrationOpen: false }
  }

  const cfg = {
    registrationDaysBeforeStart:
      settings?.registrationDaysBeforeStart ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.registrationDaysBeforeStart,
    registrationDaysAfterStart:
      settings?.registrationDaysAfterStart ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.registrationDaysAfterStart,
    examDaysBeforeEnd:
      settings?.examDaysBeforeEnd ??
      DEFAULT_TERM_LIFECYCLE_SETTINGS.examDaysBeforeEnd,
  }
  const nowMs = toStartOfDayMs(now)

  // 1. Look for currently registering terms
  const registeringTerms = enabledTerms.filter((term) =>
    isTermRegistrationOpen(term, enabledTerms, cfg, now)
  )

  if (registeringTerms.length > 0) {
    const selected = [...registeringTerms].sort(
      (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
    )[0]!

    const regAfterMs = cfg.registrationDaysAfterStart * ONE_DAY_MS
    const regDeadlineMs = toEndOfDayMs(
      new Date(toStartOfDayMs(selected.startDate) + regAfterMs)
    )
    const daysUntilEnd = Math.max(
      0,
      Math.ceil((regDeadlineMs - nowMs) / ONE_DAY_MS)
    )

    return {
      term: selected,
      isRegistrationOpen: true,
      daysUntilEndRegistration: daysUntilEnd,
    }
  }

  // 2. Look for the nearest upcoming term whose registration will open in the future
  const upcomingTerms = enabledTerms.filter(
    (term) => toStartOfDayMs(term.startDate) > nowMs
  )

  if (upcomingTerms.length > 0) {
    const selected = [...upcomingTerms].sort(
      (a, b) => toStartOfDayMs(a.startDate) - toStartOfDayMs(b.startDate)
    )[0]!

    const regBeforeMs = cfg.registrationDaysBeforeStart * ONE_DAY_MS
    const startMs = toStartOfDayMs(selected.startDate)
    const activationMs = getTermActivationDate(selected.startDate).getTime()
    const effectiveRegStartMs = Math.min(activationMs, startMs - regBeforeMs)
    const daysUntilReg = Math.max(
      0,
      Math.ceil((effectiveRegStartMs - nowMs) / ONE_DAY_MS)
    )

    return {
      term: selected,
      isRegistrationOpen: false,
      daysUntilRegistration: daysUntilReg,
    }
  }

  return { term: null, isRegistrationOpen: false }
}
