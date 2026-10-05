import type { GeneratedTermProposal } from "@workspace/types"
import { normalizeDateToYmd } from "./term-calendar-modifiers"

interface SpecialSessionModifierOptions {
  proposals: GeneratedTermProposal[]
  selectedTermIndex?: number
  isRtl: boolean
  activeCompensatoryDatesSet: Set<string>
  activeExcessDatesSet: Set<string>
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
}

export function addSpecialSessionModifiers({
  proposals,
  selectedTermIndex,
  isRtl,
  activeCompensatoryDatesSet,
  activeExcessDatesSet,
  modifiers,
  modifiersClassNames,
}: SpecialSessionModifierOptions) {
  // Helper: check if a date should have rounded start cap (Saturday in RTL / Sunday in LTR, or term start date)
  const selectedTerm =
    selectedTermIndex !== undefined ? proposals[selectedTermIndex] : null
  const selStartYmd = selectedTerm?.startDate
    ? normalizeDateToYmd(selectedTerm.startDate)
    : ""
  const selEndYmd = selectedTerm?.endDate
    ? normalizeDateToYmd(selectedTerm.endDate)
    : ""

  const isDayStartSide = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (!!selEndYmd && ymd === selEndYmd && selStartYmd !== selEndYmd) {
      return false
    }
    if (isRtl) {
      return date.getDay() === 6 || (!!selStartYmd && ymd === selStartYmd)
    }
    return date.getDay() === 0 || (!!selStartYmd && ymd === selStartYmd)
  }

  const isDayEndSide = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (isRtl) {
      return date.getDay() === 5 || (!!selEndYmd && ymd === selEndYmd)
    }
    return date.getDay() === 6 || (!!selEndYmd && ymd === selEndYmd)
  }

  // 5. Compensatory sessions (primary border and primary dot) - ONLY for the selected term
  if (activeCompensatoryDatesSet.size > 0) {
    const isCompensatory = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return activeCompensatoryDatesSet.has(ymd)
    }

    modifiers.term_compensatory = isCompensatory

    const compBase =
      "[&>button]:!border-2 [&>button]:!border-primary [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1.5 [&>button]:after:rounded-full [&>button]:after:bg-primary hover:[&>button]:!bg-primary/15"

    const compRtlRowFallback =
      "first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
    const compLtrRowFallback =
      "first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"

    modifiersClassNames.term_compensatory = `${compBase} ${isRtl ? compRtlRowFallback : compLtrRowFallback}`

    // Precise radius modifiers matching day pill boundaries
    modifiers.term_compensatory_both = (date: Date) => {
      if (!isCompensatory(date)) return false
      return isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_both =
      "!rounded-full first:!rounded-full last:!rounded-full [&>button]:!rounded-full first:[&>button]:!rounded-full last:[&>button]:!rounded-full"

    modifiers.term_compensatory_start = (date: Date) => {
      if (!isCompensatory(date)) return false
      return isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_start = isRtl
      ? "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"
      : "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"

    modifiers.term_compensatory_end = (date: Date) => {
      if (!isCompensatory(date)) return false
      return !isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_end = isRtl
      ? "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"
      : "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"

    modifiers.term_compensatory_none = (date: Date) => {
      if (!isCompensatory(date)) return false
      return !isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_none =
      "!rounded-none [&>button]:!rounded-none"
  }

  // 6. Excess sessions (Warning/amber dashed border for days exceeding target count) - ONLY for the selected term
  if (activeExcessDatesSet.size > 0) {
    const isExcess = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return (
        activeExcessDatesSet.has(ymd) && !activeCompensatoryDatesSet.has(ymd)
      )
    }

    modifiers.term_excessSession = isExcess

    const excessBase =
      "[&>button]:!border-2 [&>button]:!border-dashed [&>button]:!border-warning/80 [&>button]:!text-warning [&>button]:!font-bold hover:[&>button]:!bg-warning/15"

    const excessRtlRowFallback =
      "first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
    const excessLtrRowFallback =
      "first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"

    modifiersClassNames.term_excessSession = `${excessBase} ${isRtl ? excessRtlRowFallback : excessLtrRowFallback}`

    // Precise radius modifiers matching day pill boundaries
    modifiers.term_excessSession_both = (date: Date) => {
      if (!isExcess(date)) return false
      return isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_both =
      "!rounded-full first:!rounded-full last:!rounded-full [&>button]:!rounded-full first:[&>button]:!rounded-full last:[&>button]:!rounded-full"

    modifiers.term_excessSession_start = (date: Date) => {
      if (!isExcess(date)) return false
      return isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_start = isRtl
      ? "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"
      : "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"

    modifiers.term_excessSession_end = (date: Date) => {
      if (!isExcess(date)) return false
      return !isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_end = isRtl
      ? "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"
      : "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"

    modifiers.term_excessSession_none = (date: Date) => {
      if (!isExcess(date)) return false
      return !isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_none =
      "!rounded-none [&>button]:!rounded-none"
  }
}
