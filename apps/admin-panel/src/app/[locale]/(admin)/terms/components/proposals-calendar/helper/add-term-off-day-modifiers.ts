import { isJalaliHoliday } from "@workspace/types"
import { normalizeDateToYmd } from "./term-calendar-modifiers"
import type { TermModifierContext } from "./term-modifier-context"

export function addTermOffDayModifiers(context: TermModifierContext) {
  const {
    term,
    index,
    isRtl,
    selectedTermIndex,
    allCompensatoryDatesSet,
    customOffDaysSet,
    dismissedHolidaysSet,
    observeOfficialHolidays,
    isDateAnOffDay,
    modifiers,
    modifiersClassNames,
  } = context
  const isSelected =
    selectedTermIndex === undefined || selectedTermIndex === index
  const startYmd = normalizeDateToYmd(term.startDate)
  const endYmd = normalizeDateToYmd(term.endDate)
  // 1d. Holidays inside this specific term
  if (observeOfficialHolidays) {
    const termHolidayKey = `term_${index}_holiday`
    modifiers[termHolidayKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd < startYmd || ymd > endYmd) return false
      if (allCompensatoryDatesSet.has(ymd)) return false
      return isJalaliHoliday(date).isHoliday && !dismissedHolidaysSet.has(ymd)
    }

    const activeHolidayClassRtl =
      "!bg-destructive/15 text-destructive first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/25"
    const activeHolidayClassLtr =
      "!bg-destructive/15 text-destructive first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/25"

    const dimmedHolidayClassRtl =
      "!bg-muted/30 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/50"
    const dimmedHolidayClassLtr =
      "!bg-muted/30 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/50"

    modifiersClassNames[termHolidayKey] = isSelected
      ? isRtl
        ? activeHolidayClassRtl
        : activeHolidayClassLtr
      : isRtl
        ? dimmedHolidayClassRtl
        : dimmedHolidayClassLtr
  }

  // 1e. Fridays inside this specific term
  const termOffDayKey = `term_${index}_offDay`
  modifiers[termOffDayKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    if (ymd < startYmd || ymd > endYmd) return false
    const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
    if (!isFriday) return false
    if (allCompensatoryDatesSet.has(ymd)) return false
    return !isDateAnOffDay(date)
  }

  const activeOffDayClassRtl =
    "!bg-destructive/15 text-destructive first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold hover:[&>button]:!bg-destructive/25"
  const activeOffDayClassLtr =
    "!bg-destructive/15 text-destructive first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold hover:[&>button]:!bg-destructive/25"

  const dimmedOffDayClassRtl =
    "!bg-muted/30 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium hover:[&>button]:!bg-muted/50"
  const dimmedOffDayClassLtr =
    "!bg-muted/30 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium hover:[&>button]:!bg-muted/50"

  modifiersClassNames[termOffDayKey] = isSelected
    ? isRtl
      ? activeOffDayClassRtl
      : activeOffDayClassLtr
    : isRtl
      ? dimmedOffDayClassRtl
      : dimmedOffDayClassLtr

  // 1f. Custom off-days inside this specific term
  if (customOffDaysSet.size > 0) {
    const termCustomKey = `term_${index}_customOffDay`
    modifiers[termCustomKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd < startYmd || ymd > endYmd) return false
      return customOffDaysSet.has(ymd)
    }

    const activeCustomClassRtl =
      "!bg-warning/15 text-warning first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-warning/15 [&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning hover:[&>button]:!bg-warning/25"
    const activeCustomClassLtr =
      "!bg-warning/15 text-warning first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-warning/15 [&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning hover:[&>button]:!bg-warning/25"

    const dimmedCustomClassRtl =
      "!bg-muted/25 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"
    const dimmedCustomClassLtr =
      "!bg-muted/25 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"

    modifiersClassNames[termCustomKey] = isSelected
      ? isRtl
        ? activeCustomClassRtl
        : activeCustomClassLtr
      : isRtl
        ? dimmedCustomClassRtl
        : dimmedCustomClassLtr
  }

  // 1g. Dismissed holidays inside this specific term
  if (observeOfficialHolidays && dismissedHolidaysSet.size > 0) {
    const termDismissedKey = `term_${index}_dismissedHoliday`
    modifiers[termDismissedKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd < startYmd || ymd > endYmd) return false
      return isJalaliHoliday(date).isHoliday && dismissedHolidaysSet.has(ymd)
    }

    const activeDismissedClassRtl =
      "!bg-emerald-500/15 text-emerald-700 first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-emerald-500/15 [&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 hover:[&>button]:!bg-emerald-500/25"
    const activeDismissedClassLtr =
      "!bg-emerald-500/15 text-emerald-700 first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-emerald-500/15 [&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 hover:[&>button]:!bg-emerald-500/25"

    const dimmedDismissedClassRtl =
      "!bg-muted/25 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"
    const dimmedDismissedClassLtr =
      "!bg-muted/25 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"

    modifiersClassNames[termDismissedKey] = isSelected
      ? isRtl
        ? activeDismissedClassRtl
        : activeDismissedClassLtr
      : isRtl
        ? dimmedDismissedClassRtl
        : dimmedDismissedClassLtr
  }
}
