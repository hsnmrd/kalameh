import type { GeneratedTermProposal } from "@workspace/types"

export interface TermModifierContext {
  term: GeneratedTermProposal
  index: number
  isRtl: boolean
  selectedTermIndex?: number
  compensatorySessions: Record<
    number,
    import("@workspace/types").CompensatorySession[]
  >
  isDateAnOffDay: (date: Date) => boolean
  allCompensatoryDatesSet: Set<string>
  customOffDaysSet: Set<string>
  dismissedHolidaysSet: Set<string>
  observeOfficialHolidays: boolean
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
}
