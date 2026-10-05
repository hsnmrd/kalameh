import {
  isJalaliHoliday,
  type GeneratedTermProposal,
  type CompensatorySession,
} from "@workspace/types"
import { addSpecialSessionModifiers } from "./add-special-session-modifiers"
import { addTermBoundaryModifiers } from "./add-term-boundary-modifiers"
import { addTermCoreModifiers } from "./add-term-core-modifiers"
import { addTermOffDayModifiers } from "./add-term-off-day-modifiers"

export function normalizeDateToYmd(d: Date | string): string {
  if (typeof d === "string") {
    return d.split("T")[0] || ""
  }
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface TermCalendarModifiersResult {
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
}

export interface BuildTermCalendarModifiersOptions {
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  dismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
  selectedTermIndex?: number
}

export function buildTermCalendarModifiers(
  proposals: GeneratedTermProposal[],
  isRtl: boolean = true,
  options?: BuildTermCalendarModifiersOptions
): TermCalendarModifiersResult {
  const {
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
    compensatorySessions = {},
    selectedTermIndex,
  } = options ?? {}
  const customOffDaysSet = new Set(customOffDays)
  const dismissedHolidaysSet = new Set(dismissedHolidays)

  const allCompensatoryDatesSet = new Set(
    Object.values(compensatorySessions).flatMap((list) =>
      list.map((cs) => cs.date)
    )
  )

  const activeCompensatoryDatesSet = new Set(
    selectedTermIndex !== undefined
      ? (compensatorySessions[selectedTermIndex] ?? []).map((cs) => cs.date)
      : Object.values(compensatorySessions).flatMap((list) =>
          list.map((cs) => cs.date)
        )
  )

  const activeExcessDatesSet = new Set(
    selectedTermIndex !== undefined && proposals[selectedTermIndex]
      ? (proposals[selectedTermIndex].patternDetails ?? []).flatMap(
          (pd) => pd.excessDates ?? []
        )
      : proposals.flatMap((term) =>
          (term.patternDetails ?? []).flatMap((pd) => pd.excessDates ?? [])
        )
  )

  const isDateAnOffDay = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (customOffDaysSet.has(ymd)) return true
    if (
      observeOfficialHolidays &&
      isJalaliHoliday(date).isHoliday &&
      !dismissedHolidaysSet.has(ymd)
    ) {
      return true
    }
    return false
  }

  const modifiers: Record<string, (date: Date) => boolean> = {}
  const modifiersClassNames: Record<string, string> = {}

  // 1. Term range, start date, and end date modifiers
  proposals.forEach((term, index) => {
    const context = {
      term,
      index,
      isRtl,
      selectedTermIndex,
      compensatorySessions,
      isDateAnOffDay,
      allCompensatoryDatesSet,
      customOffDaysSet,
      dismissedHolidaysSet,
      observeOfficialHolidays,
      modifiers,
      modifiersClassNames,
    }
    addTermCoreModifiers(context)
    addTermBoundaryModifiers(context)
    addTermOffDayModifiers(context)
  })

  // 2. Off days (Only Fridays that are NOT holidays or custom off-days)
  // When outside any term: simple and colorless background so they don't attract attention
  modifiers.term_offDay = (date: Date) => {
    const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
    if (!isFriday) return false
    return !isDateAnOffDay(date)
  }

  modifiersClassNames.term_offDay =
    "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"

  // 3. Official Jalali holidays (When outside any term: simple and colorless background so they don't attract attention)
  if (observeOfficialHolidays) {
    modifiers.term_officialHoliday = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return isJalaliHoliday(date).isHoliday && !dismissedHolidaysSet.has(ymd)
    }

    modifiersClassNames.term_officialHoliday =
      "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"

    modifiers.term_dismissedHoliday = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return isJalaliHoliday(date).isHoliday && dismissedHolidaysSet.has(ymd)
    }

    modifiersClassNames.term_dismissedHoliday =
      "[&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"
  }

  // 4. Custom institute off-days (When outside any term: simple and colorless background so they don't attract attention)
  if (customOffDaysSet.size > 0) {
    modifiers.term_customOffDay = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return customOffDaysSet.has(ymd)
    }

    modifiersClassNames.term_customOffDay =
      "[&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"
  }

  addSpecialSessionModifiers({
    proposals,
    selectedTermIndex,
    isRtl,
    activeCompensatoryDatesSet,
    activeExcessDatesSet,
    modifiers,
    modifiersClassNames,
  })

  return { modifiers, modifiersClassNames }
}
