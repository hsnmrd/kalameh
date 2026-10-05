import { normalizeDateToYmd } from "./term-calendar-modifiers"
import type { TermModifierContext } from "./term-modifier-context"

export function addTermBoundaryModifiers(context: TermModifierContext) {
  const { term, index, isRtl, modifiers, modifiersClassNames } = context
  const startYmd = normalizeDateToYmd(term.startDate)
  const endYmd = normalizeDateToYmd(term.endDate)
  const isSingleDay = startYmd === endYmd
  // Dedicated high-priority radius modifiers ensuring start and end days NEVER have broken/inverted radii:
  // When a term ends on any weekday (including Saturday in RTL or Sunday in LTR), it is the end of the term ribbon
  // and must ALWAYS display as an end cap (flat on start side, fully rounded on end side), exactly matching
  // the visual standard of term ending without inheriting weekday row-start pill styling.
  const endPillStandaloneKey = `term_${index}_end_pill_standalone`
  const endPillRegularKey = `term_${index}_end_pill_regular`
  const startPillStandaloneKey = `term_${index}_start_pill_standalone`
  const startPillRegularKey = `term_${index}_start_pill_regular`
  const singlePillOverrideKey = `term_${index}_single_pill_override`

  if (isSingleDay) {
    modifiers[singlePillOverrideKey] = (date: Date) =>
      normalizeDateToYmd(date) === startYmd
    modifiersClassNames[singlePillOverrideKey] =
      "!rounded-full first:!rounded-full last:!rounded-full [&>button]:!rounded-full first:[&>button]:!rounded-full last:[&>button]:!rounded-full"
  } else {
    modifiers[endPillStandaloneKey] = () => false
    modifiersClassNames[endPillStandaloneKey] = ""

    modifiers[endPillRegularKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd === endYmd
    }
    modifiersClassNames[endPillRegularKey] = isRtl
      ? "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
      : "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"

    modifiers[startPillStandaloneKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd !== startYmd) return false
      return isRtl ? date.getDay() === 5 : date.getDay() === 6
    }
    modifiersClassNames[startPillStandaloneKey] =
      "!rounded-full first:!rounded-full last:!rounded-full [&>button]:!rounded-full first:[&>button]:!rounded-full last:[&>button]:!rounded-full"

    modifiers[startPillRegularKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd !== startYmd) return false
      return isRtl ? date.getDay() !== 5 : date.getDay() !== 6
    }
    modifiersClassNames[startPillRegularKey] = isRtl
      ? "!rounded-tr-full !rounded-br-full !rounded-tl-none !rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"
      : "!rounded-tl-full !rounded-bl-full !rounded-tr-none !rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
  }
}
