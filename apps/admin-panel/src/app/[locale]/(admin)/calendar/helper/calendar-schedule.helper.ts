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

export interface TermVisualTheme {
  id: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dotColor: string
  rangeClass: string
  startClass: string
  endClass: string
}

export const CALENDAR_TERM_THEMES: TermVisualTheme[] = [
  {
    id: "sky",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-500/30",
    dotColor: "bg-sky-500",
    rangeClass: "[&>button]:!bg-sky-500/15 font-medium",
    startClass:
      "[&>button]:!bg-sky-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-sky-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "emerald",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-500/30",
    dotColor: "bg-emerald-500",
    rangeClass: "[&>button]:!bg-emerald-500/15 font-medium",
    startClass:
      "[&>button]:!bg-emerald-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-emerald-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "violet",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-700",
    badgeBorder: "border-violet-500/30",
    dotColor: "bg-violet-500",
    rangeClass: "[&>button]:!bg-violet-500/15 font-medium",
    startClass:
      "[&>button]:!bg-violet-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-violet-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "amber",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-500/30",
    dotColor: "bg-amber-500",
    rangeClass: "[&>button]:!bg-amber-500/15 font-medium",
    startClass:
      "[&>button]:!bg-amber-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-amber-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "indigo",
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-500/30",
    dotColor: "bg-indigo-500",
    rangeClass: "[&>button]:!bg-indigo-500/15 font-medium",
    startClass:
      "[&>button]:!bg-indigo-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-indigo-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "teal",
    badgeBg: "bg-teal-500/15",
    badgeText: "text-teal-700",
    badgeBorder: "border-teal-500/30",
    dotColor: "bg-teal-500",
    rangeClass: "[&>button]:!bg-teal-500/15 font-medium",
    startClass:
      "[&>button]:!bg-teal-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-teal-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "cyan",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-700",
    badgeBorder: "border-cyan-500/30",
    dotColor: "bg-cyan-500",
    rangeClass: "[&>button]:!bg-cyan-500/15 font-medium",
    startClass:
      "[&>button]:!bg-cyan-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-cyan-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
  {
    id: "fuchsia",
    badgeBg: "bg-fuchsia-500/15",
    badgeText: "text-fuchsia-700",
    badgeBorder: "border-fuchsia-500/30",
    dotColor: "bg-fuchsia-500",
    rangeClass: "[&>button]:!bg-fuchsia-500/15 font-medium",
    startClass:
      "[&>button]:!bg-fuchsia-600 [&>button]:!text-white font-bold [&>button]:rounded-md shadow-xs",
    endClass:
      "[&>button]:!ring-2 [&>button]:!ring-fuchsia-500/80 [&>button]:!font-bold [&>button]:rounded-md",
  },
]

export function getTermTheme(
  termId: string,
  allTerms: TermDto[]
): TermVisualTheme {
  const index = allTerms.findIndex((t) => t.id === termId)
  const safeIndex = index >= 0 ? index : 0
  return CALENDAR_TERM_THEMES[safeIndex % CALENDAR_TERM_THEMES.length]!
}

export function getTermsRunningInYear(
  selectedYear: number,
  locale: "fa" | "en",
  terms: TermDto[]
): TermDto[] {
  let yearStartIso = ""
  let yearEndIso = ""

  if (locale === "fa") {
    const start = jalaliToGregorian(selectedYear, 1, 1)
    const endDays = getDaysInJalaliMonth(selectedYear, 12)
    const end = jalaliToGregorian(selectedYear, 12, endDays)
    yearStartIso = toIsoDate(start)
    yearEndIso = toIsoDate(end)
  } else {
    yearStartIso = `${selectedYear}-01-01`
    yearEndIso = `${selectedYear}-12-31`
  }

  return terms.filter((term) => {
    const startIso = normalizeIsoDate(term.startDate)
    const endIso = normalizeIsoDate(term.endDate)
    if (!startIso || !endIso) return false
    return startIso <= yearEndIso && endIso >= yearStartIso
  })
}

export function buildCalendarTermModifiers(
  termsToDisplay: TermDto[],
  allTerms: TermDto[]
): {
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
} {
  const modifiers: Record<string, (date: Date) => boolean> = {}
  const modifiersClassNames: Record<string, string> = {}

  termsToDisplay.forEach((term) => {
    const startIso = normalizeIsoDate(term.startDate)
    const endIso = normalizeIsoDate(term.endDate)
    if (!startIso || !endIso) return

    const theme = getTermTheme(term.id, allTerms)
    const startKey = `term_${term.id}_start`
    const endKey = `term_${term.id}_end`
    const rangeKey = `term_${term.id}_range`

    const isSingleDay = startIso === endIso

    modifiers[startKey] = (date: Date) => toIsoDate(date) === startIso
    modifiersClassNames[startKey] = theme.startClass

    if (!isSingleDay) {
      modifiers[endKey] = (date: Date) => toIsoDate(date) === endIso
      modifiersClassNames[endKey] = theme.endClass

      modifiers[rangeKey] = (date: Date) => {
        const d = toIsoDate(date)
        return d > startIso && d < endIso
      }
      modifiersClassNames[rangeKey] = theme.rangeClass
    }
  })

  return { modifiers, modifiersClassNames }
}
