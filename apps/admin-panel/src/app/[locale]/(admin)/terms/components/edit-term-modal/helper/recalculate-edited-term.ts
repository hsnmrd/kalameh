import {
  hasTermDateConflict,
  recalculatePhaseTerms,
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type WeekDay,
} from "@workspace/types"

interface RecalculateEditedTermOptions {
  proposals: GeneratedTermProposal[]
  lockedTermIndex: number
  changedIndex: number
  newStartDate: string
  sessionsPerTerm: number
  daysOfWeek: WeekDay[]
  classPatterns: ReturnType<typeof resolveClassPatterns>
  userCustomTitles?: Record<number, string>
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  validateBoundary?: boolean
  getBoundaryError: (title: string) => string
  existingTerms?: Array<{
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  }>
}

export function recalculateEditedTerm({
  proposals,
  lockedTermIndex,
  changedIndex,
  newStartDate,
  sessionsPerTerm,
  daysOfWeek,
  classPatterns,
  userCustomTitles,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  compensatorySessions,
  validateBoundary = true,
  getBoundaryError,
  existingTerms,
}: RecalculateEditedTermOptions) {
  const recalculated = recalculatePhaseTerms({
    proposals,
    changedIndex,
    newStartDate,
    sessionsPerTerm,
    daysPerTerm: sessionsPerTerm,
    daysOfWeek,
    classPatterns,
    gapDaysBetweenTerms: 2,
    userCustomTitles,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays,
    compensatorySessions,
  })
  const active = recalculated[lockedTermIndex]
  const nextSibling = proposals[lockedTermIndex + 1]
  if (validateBoundary && active && nextSibling?.startDate) {
    const activeEnd = new Date(`${active.endDate}T12:00:00`)
    const nextStart = new Date(`${nextSibling.startDate}T12:00:00`)
    if (activeEnd >= nextStart) {
      throw new Error(getBoundaryError(nextSibling.title))
    }
  }
  if (validateBoundary && active && existingTerms && existingTerms.length > 0) {
    const conflicting = existingTerms.find((et) =>
      hasTermDateConflict(active, et)
    )
    if (conflicting) {
      throw new Error(
        `تاریخ ترم (${active.title}) با ترم «${conflicting.title}» تداخل زمانی دارد.`
      )
    }
  }
  return recalculated.map((entry, index) =>
    index === lockedTermIndex ? entry : (proposals[index] ?? entry)
  )
}
