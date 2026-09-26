import { getTermExamDates } from "@workspace/types"
import { DIMMED_TERM_COLOR_THEME, getTermColorTheme } from "./term-color-themes"
import { normalizeDateToYmd } from "./term-calendar-modifiers"
import type { TermModifierContext } from "./term-modifier-context"

export function addTermCoreModifiers(context: TermModifierContext) {
  const {
    term,
    index,
    isRtl,
    selectedTermIndex,
    compensatorySessions,
    isDateAnOffDay,
    allCompensatoryDatesSet,
    modifiers,
    modifiersClassNames,
  } = context
  const isSelected =
    selectedTermIndex === undefined || selectedTermIndex === index
  const theme = isSelected ? getTermColorTheme(index) : DIMMED_TERM_COLOR_THEME
  const startYmd = normalizeDateToYmd(term.startDate)
  const endYmd = normalizeDateToYmd(term.endDate)

  const evenPattern = term.patternDetails?.find((p) => p.track === "EVEN")
  const oddPattern = term.patternDetails?.find((p) => p.track === "ODD")

  const evenDates = new Set<string>()
  const oddDates = new Set<string>()

  if (evenPattern?.sessionDates && evenPattern.sessionDates.length > 0) {
    evenPattern.sessionDates.forEach((d) => evenDates.add(d))
  }
  if (oddPattern?.sessionDates && oddPattern.sessionDates.length > 0) {
    oddPattern.sessionDates.forEach((d) => oddDates.add(d))
  }

  const termCompensatories = compensatorySessions[index] ?? []
  termCompensatories.forEach((cs) => {
    if (cs.patternTrack === "EVEN") {
      evenDates.add(cs.date)
    } else if (cs.patternTrack === "ODD") {
      oddDates.add(cs.date)
    }
  })

  // Fallback if proposal has no patternDetails (e.g. basic mock data)
  if (evenDates.size === 0 && oddDates.size === 0) {
    let curr = new Date(term.startDate)
    const endD = new Date(term.endDate)
    while (curr <= endD) {
      const ymd = normalizeDateToYmd(curr)
      if (!isDateAnOffDay(curr)) {
        const dayOfWeek = curr.getDay()
        if (dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 3) {
          evenDates.add(ymd)
        } else if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
          oddDates.add(ymd)
        }
      }
      curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  const rangeKey = `term_${index}_range`
  const startKey = `term_${index}_start`
  const startPillKey = `term_${index}_start_pill`
  const endKey = `term_${index}_end`
  const endPillKey = `term_${index}_end_pill`
  const evenSessionKey = `term_${index}_even_session`
  const oddSessionKey = `term_${index}_odd_session`

  const isSingleDay = startYmd === endYmd
  const rangeClass = isRtl ? theme.rangeClassRtl : theme.rangeClassLtr
  const evenSessionClass = isRtl
    ? theme.evenSessionClassRtl
    : theme.evenSessionClassLtr
  const oddSessionClass = isRtl
    ? theme.oddSessionClassRtl
    : theme.oddSessionClassLtr
  const startClass = isRtl ? theme.startClassRtl : theme.startClassLtr
  const endClass = isRtl ? theme.endClassRtl : theme.endClassLtr

  // 1a. Even session days
  modifiers[evenSessionKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    if (isDateAnOffDay(date) && !allCompensatoryDatesSet.has(ymd)) return false
    return evenDates.has(ymd)
  }
  modifiersClassNames[evenSessionKey] = evenSessionClass

  // 1b. Odd session days
  modifiers[oddSessionKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    if (isDateAnOffDay(date) && !allCompensatoryDatesSet.has(ymd)) return false
    return oddDates.has(ymd)
  }
  modifiersClassNames[oddSessionKey] = oddSessionClass

  // 1c. Final Exam Sessions (one odd session and one even session per term)
  const examDatesForTerm = new Set<string>()
  if (term.examDates && term.examDates.length > 0) {
    term.examDates.forEach((d) => examDatesForTerm.add(d))
  } else {
    const { examDates } = getTermExamDates(term)
    if (examDates.length > 0) {
      examDates.forEach((d) => examDatesForTerm.add(d))
    } else {
      const sortedEven = Array.from(evenDates).sort()
      const sortedOdd = Array.from(oddDates).sort()
      if (sortedEven.length > 0) {
        examDatesForTerm.add(sortedEven[sortedEven.length - 1]!)
      }
      if (sortedOdd.length > 0) {
        examDatesForTerm.add(sortedOdd[sortedOdd.length - 1]!)
      }
      if (examDatesForTerm.size === 0 && term.endDate) {
        examDatesForTerm.add(normalizeDateToYmd(term.endDate))
      }
    }
  }

  const examSessionKey = `term_${index}_exam_session`
  modifiers[examSessionKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    return examDatesForTerm.has(ymd)
  }
  modifiersClassNames[examSessionKey] = isSelected
    ? "[&>button]:relative [&>button]:before:content-['★'] [&>button]:before:absolute [&>button]:before:bottom-0.5 [&>button]:before:left-1/2 [&>button]:before:-translate-x-1/2 [&>button]:before:text-[9px] [&>button]:before:leading-none [&>button]:before:!text-current [&>button]:before:pointer-events-none [&>button]:before:z-10"
    : "[&>button]:relative [&>button]:before:content-['★'] [&>button]:before:absolute [&>button]:before:bottom-0.5 [&>button]:before:left-1/2 [&>button]:before:-translate-x-1/2 [&>button]:before:text-[9px] [&>button]:before:leading-none [&>button]:before:!text-current/60 [&>button]:before:pointer-events-none [&>button]:before:z-10"

  // 1d. Continuous range bar (light background tint for non-session days inside term)
  modifiers[rangeKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    if (ymd < startYmd || ymd > endYmd) return false
    if (evenDates.has(ymd) || oddDates.has(ymd)) return false
    if (isDateAnOffDay(date)) return false
    const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
    if (isFriday) return false
    return true
  }
  modifiersClassNames[rangeKey] = rangeClass

  // Start day container pill curve (applies to container cell even if holiday)
  modifiers[startPillKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    return ymd === startYmd
  }
  modifiersClassNames[startPillKey] = isSingleDay
    ? theme.singlePill
    : isRtl
      ? theme.startPillRtl
      : theme.startPillLtr

  // Start day button: filled color button ONLY if NOT an off day / holiday.
  // If off day / holiday, off-day style overrides the button styling.
  modifiers[startKey] = (date: Date) => {
    const ymd = normalizeDateToYmd(date)
    if (ymd !== startYmd) return false
    return !isDateAnOffDay(date)
  }
  modifiersClassNames[startKey] = isSingleDay ? theme.singleClass : startClass

  // End day container pill curve
  modifiers[endPillKey] = (date: Date) => {
    if (isSingleDay) return false
    const ymd = normalizeDateToYmd(date)
    return ymd === endYmd
  }
  modifiersClassNames[endPillKey] = isRtl ? theme.endPillRtl : theme.endPillLtr

  // End day button: normal end day typography ONLY if NOT an off day / holiday.
  modifiers[endKey] = (date: Date) => {
    if (isSingleDay) return false
    const ymd = normalizeDateToYmd(date)
    return ymd === endYmd && !isDateAnOffDay(date)
  }
  modifiersClassNames[endKey] = isSingleDay ? "" : endClass
}
