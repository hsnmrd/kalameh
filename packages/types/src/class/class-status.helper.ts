export interface ClassStatusSubject {
  sessionDates?: string[] | null
  endTime?: string | null
  term?: {
    isActive?: boolean
    startDate?: string | Date | null
    endDate?: string | Date | null
  } | null
}

/**
 * Parses a date (string or Date object) and optionally attaches a time ("HH:mm").
 * If no valid endTime is given, defaults to the end of the day (23:59:59.999).
 * Avoids timezone drift by parsing date strings (YYYY-MM-DD) directly by component.
 */
export function parseDateWithEndTime(
  dateInput: string | Date,
  endTime?: string | null
): Date | null {
  if (!dateInput) return null

  let year: number
  let month: number
  let day: number

  if (typeof dateInput === "string") {
    const raw = dateInput.trim().split("T")[0] || ""
    const parts = raw.split("-").map(Number)
    if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
      year = parts[0]!
      month = parts[1]! - 1
      day = parts[2]!
    } else {
      const parsed = new Date(dateInput)
      if (isNaN(parsed.getTime())) return null
      year = parsed.getFullYear()
      month = parsed.getMonth()
      day = parsed.getDate()
    }
  } else if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null
    year = dateInput.getFullYear()
    month = dateInput.getMonth()
    day = dateInput.getDate()
  } else {
    return null
  }

  if (endTime && typeof endTime === "string") {
    const match = endTime.trim().match(/^(\d{1,2}):(\d{2})/)
    if (match) {
      const hours = parseInt(match[1]!, 10)
      const minutes = parseInt(match[2]!, 10)
      if (!isNaN(hours) && !isNaN(minutes)) {
        return new Date(year, month, day, hours, minutes, 0, 0)
      }
    }
  }

  return new Date(year, month, day, 23, 59, 59, 999)
}

/**
 * Determines whether a class has finished its duration or is inactive.
 *
 * Rules:
 * 1. If the term is inactive (`term.isActive === false`), the class is considered done/inactive.
 * 2. If the class has explicit `sessionDates` (non-empty):
 *    - Sorts the session dates chronologically.
 *    - Combines the latest session date with `endTime` (or end of day).
 *    - If `now > lastSessionEnd`, the class has finished its duration.
 *    - Otherwise (if latest session is ongoing or in future), it is active (not done).
 * 3. If `sessionDates` is empty or not provided:
 *    - Falls back to `term.endDate`.
 *    - Combines `term.endDate` with `endTime` (or end of day).
 *    - If `now > termEnd`, the class duration has finished.
 * 4. Otherwise, returns false.
 */
export function isClassDone(
  cls: ClassStatusSubject | null | undefined,
  now: Date = new Date()
): boolean {
  if (!cls) return false

  if (cls.term && cls.term.isActive === false) {
    return true
  }

  if (cls.sessionDates && cls.sessionDates.length > 0) {
    const validDates = cls.sessionDates
      .map((d) => (typeof d === "string" ? d.trim().split("T")[0] : ""))
      .filter((d): d is string => Boolean(d && /^\d{4}-\d{2}-\d{2}$/.test(d)))

    if (validDates.length > 0) {
      validDates.sort()
      const lastSessionStr = validDates[validDates.length - 1]!
      const lastSessionEnd = parseDateWithEndTime(lastSessionStr, cls.endTime)
      if (lastSessionEnd) {
        return now.getTime() > lastSessionEnd.getTime()
      }
    }
  }

  if (cls.term?.endDate) {
    const termEnd = parseDateWithEndTime(cls.term.endDate, cls.endTime)
    if (termEnd) {
      return now.getTime() > termEnd.getTime()
    }
  }

  return false
}

export const isClassFinished = isClassDone
