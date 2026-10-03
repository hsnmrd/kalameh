"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  convertTermDtoToProposal,
  resolveClassPatterns,
  type TermDto,
  type WeekDay,
} from "@workspace/types"
import {
  institutesResource,
  operatingPhasesResource,
  termsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

function toInputDate(value: string | Date | undefined) {
  if (!value) return ""
  return new Date(value).toISOString().split("T")[0] || ""
}

export function useViewTermCalendar(
  term: TermDto | null,
  allTerms: TermDto[] | undefined,
  open: boolean
) {
  const t = useTranslations("terms")
  const { activeInstituteId } = useActiveInstitute()
  const phaseId = term?.operatingPhaseId
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && open),
  })
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      operatingPhaseId: phaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && phaseId && open),
  })
  const dismissedHolidays = React.useMemo(
    () => institute?.dismissedHolidays ?? [],
    [institute?.dismissedHolidays]
  )
  const customOffDays = React.useMemo(
    () => rawCustomOffDays?.map((day) => day.date) ?? [],
    [rawCustomOffDays]
  )
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true
  const proposals = React.useMemo(() => {
    if (!term || !open) return []
    const phase = phases.find((value) => value.id === phaseId)
    const phaseDays = phase?.daysOfWeek?.length
      ? phase.daysOfWeek
      : term.operatingPhase?.daysOfWeek?.length
        ? term.operatingPhase.daysOfWeek
        : ["SATURDAY", "MONDAY", "WEDNESDAY"]
    const daysOfWeek = phaseDays as WeekDay[]
    const classPatterns = resolveClassPatterns(daysOfWeek)
    const activeTerm = {
      id: term.id,
      title: term.title,
      startDate: toInputDate(term.startDate),
      endDate: toInputDate(term.endDate),
      operatingPhaseId: term.operatingPhaseId || undefined,
      operatingPhase: phase
        ? { months: phase.months, daysOfWeek: phase.daysOfWeek }
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
      phaseTerms.length > 0
        ? phaseTerms
        : (allTerms?.filter(
            (value) => value.operatingPhaseId === term.operatingPhaseId
          ) ?? [])
    ).filter((value) => value.id !== term.id)
    return [...siblings, activeTerm]
      .sort(
        (first, second) =>
          new Date(first.startDate).getTime() -
          new Date(second.startDate).getTime()
      )
      .map((value) =>
        convertTermDtoToProposal(value, {
          daysOfWeek,
          classPatterns,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays:
            value.id === term.id ? dismissedHolidays : undefined,
          compensatorySessions: [],
        })
      )
  }, [
    term,
    open,
    phases,
    phaseId,
    phaseTerms,
    allTerms,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays,
  ])
  const lockedTermIndex = React.useMemo(() => {
    const index = proposals.findIndex(
      (proposal) =>
        proposal.title === term?.title ||
        proposal.startDate === toInputDate(term?.startDate)
    )
    return index === -1 ? 0 : index
  }, [proposals, term])
  const phaseTitle = React.useMemo(() => {
    if (!phaseId) return t("viewModal.noPhase")
    return (
      phases.find((phase) => phase.id === phaseId)?.title ||
      term?.operatingPhase?.title ||
      t("viewModal.operatingPhase")
    )
  }, [phaseId, phases, term, t])

  return {
    phaseId,
    proposals,
    lockedTermIndex,
    activeProposal: proposals[lockedTermIndex],
    phaseTitle,
    dismissedHolidays,
    customOffDays,
    observeOfficialHolidays,
  }
}
