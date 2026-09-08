export const STUDENT_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
export const STUDENT_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export interface ComparableStudentTimeConstraint {
  dayOfWeek: string
  startTime: string
  endTime: string
  effectiveFrom?: string | Date | null
  effectiveUntil?: string | Date | null
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

export function dateToTimestamp(
  value: string | Date | null | undefined,
  fallback: number
): number {
  if (value === null || value === undefined) return fallback
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

export function isValidStudentEffectiveDate(value: string): boolean {
  if (!STUDENT_DATE_REGEX.test(value)) {
    return !Number.isNaN(Date.parse(value))
  }

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day
  )
}

export function studentConstraintDateRangesOverlap(
  first: ComparableStudentTimeConstraint,
  second: ComparableStudentTimeConstraint
): boolean {
  const firstStart = dateToTimestamp(
    first.effectiveFrom,
    Number.NEGATIVE_INFINITY
  )
  const firstEnd = dateToTimestamp(
    first.effectiveUntil,
    Number.POSITIVE_INFINITY
  )
  const secondStart = dateToTimestamp(
    second.effectiveFrom,
    Number.NEGATIVE_INFINITY
  )
  const secondEnd = dateToTimestamp(
    second.effectiveUntil,
    Number.POSITIVE_INFINITY
  )

  return firstStart <= secondEnd && secondStart <= firstEnd
}

export function studentConstraintTimesOverlap(
  first: ComparableStudentTimeConstraint,
  second: ComparableStudentTimeConstraint
): boolean {
  if (first.dayOfWeek !== second.dayOfWeek) return false

  return (
    timeToMinutes(first.startTime) < timeToMinutes(second.endTime) &&
    timeToMinutes(second.startTime) < timeToMinutes(first.endTime)
  )
}
