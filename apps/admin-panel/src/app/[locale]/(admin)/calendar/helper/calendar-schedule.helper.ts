import type { TermDto, ClassDto } from "@workspace/types"
import { gregorianToJalali, jalaliToGregorian } from "@workspace/types"

export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function normalizeIsoDate(
  value: string | Date | undefined | null
): string {
  if (!value) return ""
  if (value instanceof Date) {
    return toIsoDate(value)
  }
  return value.split("T")[0] || ""
}

export function isDateInTerm(date: Date, term: TermDto): boolean {
  const targetIso = toIsoDate(date)
  const startIso = normalizeIsoDate(term.startDate)
  const endIso = normalizeIsoDate(term.endDate)
  if (!startIso || !endIso) return false
  return targetIso >= startIso && targetIso <= endIso
}

export function getActiveTermsForDate(date: Date, terms: TermDto[]): TermDto[] {
  return terms.filter((term) => isDateInTerm(date, term))
}

export function getClassesForDate(date: Date, classes: ClassDto[]): ClassDto[] {
  const targetIso = toIsoDate(date)
  return classes.filter(
    (c) => Array.isArray(c.sessionDates) && c.sessionDates.includes(targetIso)
  )
}

export function isDateInAnyTerm(date: Date, terms: TermDto[]): boolean {
  const targetIso = toIsoDate(date)
  return terms.some((term) => {
    const startIso = normalizeIsoDate(term.startDate)
    const endIso = normalizeIsoDate(term.endDate)
    return Boolean(
      startIso && endIso && targetIso >= startIso && targetIso <= endIso
    )
  })
}

export function isDateClassSession(date: Date, classes: ClassDto[]): boolean {
  const targetIso = toIsoDate(date)
  return classes.some(
    (c) => Array.isArray(c.sessionDates) && c.sessionDates.includes(targetIso)
  )
}

function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  const rem = year % 33
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(rem)
  return isLeap ? 30 : 29
}

export function getTermsRunningInMonth(
  monthDate: Date,
  locale: "fa" | "en",
  terms: TermDto[]
): TermDto[] {
  let monthStartIso = ""
  let monthEndIso = ""

  if (locale === "fa") {
    const { year, month } = gregorianToJalali(monthDate)
    const days = getDaysInJalaliMonth(year, month)
    const start = jalaliToGregorian(year, month, 1)
    const end = jalaliToGregorian(year, month, days)
    monthStartIso = toIsoDate(start)
    monthEndIso = toIsoDate(end)
  } else {
    const y = monthDate.getFullYear()
    const m = monthDate.getMonth()
    const start = new Date(y, m, 1, 12, 0, 0)
    const end = new Date(y, m + 1, 0, 12, 0, 0)
    monthStartIso = toIsoDate(start)
    monthEndIso = toIsoDate(end)
  }

  return terms.filter((term) => {
    const startIso = normalizeIsoDate(term.startDate)
    const endIso = normalizeIsoDate(term.endDate)
    if (!startIso || !endIso) return false
    return startIso <= monthEndIso && endIso >= monthStartIso
  })
}

export function formatDisplayDate(date: Date, locale: "fa" | "en"): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(date)
  } catch {
    return toIsoDate(date)
  }
}
