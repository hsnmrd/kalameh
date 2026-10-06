import {
  recalculatePhaseTerms,
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type WeekDay,
} from "@workspace/types"

interface RecalculateProposalsOptions {
  proposals: GeneratedTermProposal[]
  changedIndex: number
  newStartDate: string
  sessionsPerTerm: number
  daysOfWeek: WeekDay[]
  classPatterns: ReturnType<typeof resolveClassPatterns>
  gapDays: number
  customTitles: Record<number, string>
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  pinnedStartDates: Record<number, string>
  existingTerms?: Array<{
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  }>
}

export function recalculateProposals({
  proposals,
  changedIndex,
  newStartDate,
  sessionsPerTerm,
  daysOfWeek,
  classPatterns,
  gapDays,
  customTitles,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  compensatorySessions,
  pinnedStartDates,
  existingTerms,
}: RecalculateProposalsOptions) {
  return recalculatePhaseTerms({
    proposals,
    changedIndex,
    newStartDate,
    sessionsPerTerm,
    daysPerTerm: sessionsPerTerm,
    daysOfWeek,
    classPatterns,
    gapDaysBetweenTerms: gapDays,
    userCustomTitles: customTitles,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays,
    compensatorySessions,
    pinnedStartDates,
    existingTerms,
  })
}
