"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  convertTermDtoToProposal,
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type TermDto,
  type WeekDay,
} from "@workspace/types"
import {
  institutesResource,
  operatingPhasesResource,
  termsResource,
} from "@/lib/api"

const EMPTY_DISMISSED_HOLIDAYS: string[] = []

export function formatDateForInput(dateValue: string | Date | undefined) {
  if (!dateValue) return ""
  return new Date(dateValue).toISOString().split("T")[0] || ""
}

interface EditTermCalendarStateOptions {
  term: TermDto | null
  allTerms?: TermDto[]
  open: boolean
  activeInstituteId?: string | null
  watchedPhaseId?: string | null
  watchedTitle?: string
  originalStartDate: string
}

export function useEditTermCalendarState({
  term,
  allTerms,
  open,
  activeInstituteId,
  watchedPhaseId,
  watchedTitle,
  originalStartDate,
}: EditTermCalendarStateOptions) {
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId || undefined,
    }),
    enabled: Boolean(activeInstituteId && open),
  })
  const targetPhaseId = term?.operatingPhaseId || watchedPhaseId
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId || undefined,
      operatingPhaseId: targetPhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && targetPhaseId && open),
  })
  const [dismissedHolidaysOverride, setDismissedHolidaysOverride] =
    React.useState<string[] | null>(null)
  const [localCustomOffDays, setLocalCustomOffDays] = React.useState<
    string[] | null
  >(null)
  const [compensatorySessions, setCompensatorySessions] = React.useState<
    Record<number, CompensatorySession[]>
  >({})
  const [proposalDraft, setProposalDraft] = React.useState<{
    key: string
    proposals: GeneratedTermProposal[]
  } | null>(null)
  const customOffDays = React.useMemo(
    () =>
      localCustomOffDays ??
      rawCustomOffDays?.map((offDay) => offDay.date) ??
      [],
    [localCustomOffDays, rawCustomOffDays]
  )
  const dismissedHolidays =
    dismissedHolidaysOverride ??
    institute?.dismissedHolidays ??
    EMPTY_DISMISSED_HOLIDAYS
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true
  const currentPhase = phases.find((phase) => phase.id === targetPhaseId)
  const daysOfWeek = React.useMemo(
    () =>
      (currentPhase?.daysOfWeek?.length
        ? currentPhase.daysOfWeek
        : term?.operatingPhase?.daysOfWeek?.length
          ? term.operatingPhase.daysOfWeek
          : ["SATURDAY", "MONDAY", "WEDNESDAY"]) as WeekDay[],
    [currentPhase, term]
  )
  const classPatterns = React.useMemo(
    () => resolveClassPatterns(daysOfWeek),
    [daysOfWeek]
  )

  const initialProposals = React.useMemo(() => {
    if (!term) return []
    const activeTerm = {
      id: term.id,
      title: term.title,
      startDate: formatDateForInput(term.startDate),
      endDate: formatDateForInput(term.endDate),
      operatingPhaseId: term.operatingPhaseId || undefined,
      operatingPhase: currentPhase
        ? { months: currentPhase.months, daysOfWeek: currentPhase.daysOfWeek }
        : term.operatingPhase,
    }
    if (!term.operatingPhaseId) {
      return [
        convertTermDtoToProposal(activeTerm, {
          daysOfWeek,
          classPatterns,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays,
          compensatorySessions: [],
        }),
      ]
    }
    const siblings = (
      phaseTerms.length
        ? phaseTerms
        : (allTerms?.filter(
            (item) => item.operatingPhaseId === term.operatingPhaseId
          ) ?? [])
    ).filter((item) => item.id !== term.id)
    return [...siblings, activeTerm]
      .sort(
        (first, second) =>
          new Date(first.startDate || 0).getTime() -
          new Date(second.startDate || 0).getTime()
      )
      .map((item) =>
        convertTermDtoToProposal(item, {
          daysOfWeek,
          classPatterns,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays:
            item.id === term.id ? dismissedHolidays : undefined,
          compensatorySessions: item.id === term.id ? [] : undefined,
        })
      )
  }, [
    term,
    currentPhase,
    daysOfWeek,
    classPatterns,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays,
    phaseTerms,
    allTerms,
  ])
  const sourceKey = [
    term?.id ?? "",
    targetPhaseId ?? "",
    ...phaseTerms.map(
      (item) => `${item.id}:${item.title}:${item.startDate}:${item.endDate}`
    ),
  ].join("|")
  const proposalValues =
    proposalDraft?.key === sourceKey
      ? proposalDraft.proposals
      : initialProposals
  const lockedTermIndex = Math.max(
    0,
    proposalValues.findIndex(
      (proposal) =>
        (proposal.title === term?.title &&
          proposal.startDate === originalStartDate) ||
        proposal.startDate === originalStartDate
    )
  )
  const proposals = proposalValues.map((proposal, index) =>
    index === lockedTermIndex
      ? { ...proposal, title: watchedTitle || term?.title || "" }
      : proposal
  )
  const setProposals = (next: GeneratedTermProposal[]) =>
    setProposalDraft({ key: sourceKey, proposals: next })
  const siblingCounts = proposals
    .filter((_, index) => index !== lockedTermIndex)
    .map((proposal) => proposal.sessionsCount)
    .filter((count): count is number => Boolean(count && count > 0))
  const frequencies = siblingCounts.reduce<Record<number, number>>(
    (counts, value) => ({ ...counts, [value]: (counts[value] || 0) + 1 }),
    {}
  )
  const standardSessionsCount = siblingCounts.reduce(
    (mode, count) =>
      (frequencies[count] ?? 0) > (frequencies[mode] ?? 0) ? count : mode,
    siblingCounts[0] ?? proposals[lockedTermIndex]?.sessionsCount ?? 18
  )

  return {
    classPatterns,
    compensatorySessions,
    customOffDays,
    daysOfWeek,
    dismissedHolidays,
    lockedTermIndex,
    observeOfficialHolidays,
    proposals,
    rawCustomOffDays,
    setCompensatorySessions,
    setDismissedHolidaysOverride,
    setLocalCustomOffDays,
    setProposalDraft,
    setProposals,
    standardSessionsCount,
    targetPhaseId,
  }
}
