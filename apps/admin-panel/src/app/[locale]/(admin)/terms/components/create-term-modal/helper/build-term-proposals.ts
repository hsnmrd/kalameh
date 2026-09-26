import {
  convertTermDtoToProposal,
  type CompensatorySession,
  type GeneratedTermProposal,
  type OperatingPhaseWithSlots,
  type TermDto,
} from "@workspace/types"

interface Options {
  title: string
  titlePlaceholder: string
  startDate?: string
  endDate?: string
  phaseId?: string | null
  phases: OperatingPhaseWithSlots[]
  phaseTerms: TermDto[]
  allTerms?: TermDto[]
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
}

export function buildTermProposals(options: Options): GeneratedTermProposal[] {
  const siblings = options.phaseId
    ? (options.phaseTerms.length > 0
        ? options.phaseTerms
        : (options.allTerms?.filter(
            (term) => term.operatingPhaseId === options.phaseId
          ) ?? [])
      ).filter(Boolean)
    : []
  const currentPhase = options.phases.find(
    (phase) => phase.id === options.phaseId
  )
  const hasValidDates = Boolean(
    options.startDate && options.endDate && options.startDate <= options.endDate
  )

  if (!hasValidDates) {
    return siblings
      .sort(
        (first, second) =>
          new Date(first.startDate).getTime() -
          new Date(second.startDate).getTime()
      )
      .map((term) =>
        convertTermDtoToProposal(term, {
          observeOfficialHolidays: options.observeOfficialHolidays,
          customOffDays: options.customOffDays,
        })
      )
  }

  const draft = {
    id: "draft-new-term",
    title: options.title || options.titlePlaceholder,
    startDate: options.startDate!,
    endDate: options.endDate!,
    operatingPhaseId: options.phaseId || undefined,
    operatingPhase: currentPhase
      ? { months: currentPhase.months, daysOfWeek: currentPhase.daysOfWeek }
      : undefined,
  }
  if (!options.phaseId) {
    return [
      convertTermDtoToProposal(draft, {
        observeOfficialHolidays: options.observeOfficialHolidays,
        customOffDays: options.customOffDays,
        dismissedHolidays: options.dismissedHolidays,
        compensatorySessions: options.compensatorySessions[0] ?? [],
      }),
    ]
  }

  return [...siblings, draft]
    .sort(
      (first, second) =>
        new Date(first.startDate).getTime() -
        new Date(second.startDate).getTime()
    )
    .map((term, index) => {
      const isDraft = term.id === "draft-new-term"
      return convertTermDtoToProposal(term, {
        observeOfficialHolidays: options.observeOfficialHolidays,
        customOffDays: options.customOffDays,
        dismissedHolidays: isDraft ? options.dismissedHolidays : undefined,
        compensatorySessions: isDraft
          ? (options.compensatorySessions[index] ?? [])
          : undefined,
      })
    })
}
