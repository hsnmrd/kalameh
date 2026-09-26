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
  })
}
