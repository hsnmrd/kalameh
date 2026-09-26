"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@workspace/ui/components/sonner"
import {
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type OperatingPhase,
  type WeekDay,
} from "@workspace/types"
import { recalculateProposals } from "../helper/recalculate-proposals"

interface PhaseTermCompensatoryActionsOptions {
  phases: OperatingPhase[]
  activePhaseId: string
  proposals: GeneratedTermProposal[]
  setProposals: React.Dispatch<React.SetStateAction<GeneratedTermProposal[]>>
  sessionsPerTerm: number
  gapDays: number
  customTitles: Record<number, string>
  classPatterns: ReturnType<typeof resolveClassPatterns>
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  setCompensatorySessions: React.Dispatch<
    React.SetStateAction<Record<number, CompensatorySession[]>>
  >
  pinnedStartDates: Record<number, string>
}

export function usePhaseTermCompensatoryActions({
  phases,
  activePhaseId,
  proposals,
  setProposals,
  sessionsPerTerm,
  gapDays,
  customTitles,
  classPatterns,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  compensatorySessions,
  setCompensatorySessions,
  pinnedStartDates,
}: PhaseTermCompensatoryActionsOptions) {
  const t = useTranslations("terms")
  const daysOfWeek = (
    phases.find((phase) => phase.id === activePhaseId)?.daysOfWeek?.length
      ? phases.find((phase) => phase.id === activePhaseId)?.daysOfWeek
      : ["SATURDAY", "MONDAY", "WEDNESDAY"]
  ) as WeekDay[]

  const update = (
    termIndex: number,
    nextCompensatory: Record<number, CompensatorySession[]>
  ) => {
    setCompensatorySessions(nextCompensatory)
    const proposal = proposals[termIndex]
    if (!proposal) return false
    setProposals(
      recalculateProposals({
        proposals,
        changedIndex: termIndex,
        newStartDate: proposal.startDate,
        sessionsPerTerm,
        daysOfWeek,
        classPatterns,
        gapDays,
        customTitles,
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays,
        compensatorySessions: nextCompensatory,
        pinnedStartDates,
      })
    )
    return true
  }

  const reportError = (error: unknown) => {
    toast.error(
      error instanceof Error ? error.message : t("batchModal.recalculateError")
    )
  }

  const handleAddCompensatorySession = (
    termIndex: number,
    session: CompensatorySession
  ) => {
    try {
      const existing = compensatorySessions[termIndex] ?? []
      if (
        existing.some(
          (item) =>
            item.date === session.date &&
            item.patternTrack === session.patternTrack
        )
      ) {
        return
      }
      const changed = update(termIndex, {
        ...compensatorySessions,
        [termIndex]: [...existing, session],
      })
      if (changed) toast.success(t("batchModal.compensatorySessionAdded"))
    } catch (error) {
      reportError(error)
    }
  }

  const handleRemoveCompensatorySession = (termIndex: number, date: string) => {
    try {
      const changed = update(termIndex, {
        ...compensatorySessions,
        [termIndex]: (compensatorySessions[termIndex] ?? []).filter(
          (session) => session.date !== date
        ),
      })
      if (changed) toast.success(t("batchModal.compensatorySessionRemoved"))
    } catch (error) {
      reportError(error)
    }
  }

  return {
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
  }
}
