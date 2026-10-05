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
    try {
      setProposals(
        recalculateProposals({
          proposals,
          changedIndex: termIndex,
          newStartDate: proposals[termIndex]?.startDate || "",
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
    } catch {
      toast.error(t("batchModal.recalculateError"))
    }
  }

  const handleAddCompensatorySession = (
    termIndex: number,
    session: CompensatorySession
  ) => {
    const existingForTerm = compensatorySessions[termIndex] ?? []
    if (existingForTerm.some((s) => s.date === session.date)) return

    const nextCompensatory = {
      ...compensatorySessions,
      [termIndex]: [...existingForTerm, session],
    }
    update(termIndex, nextCompensatory)
    toast.success(t("batchModal.compensatorySessionAdded"))
  }

  const handleRemoveCompensatorySession = (
    termIndex: number,
    dateYmd: string
  ) => {
    const existingForTerm = compensatorySessions[termIndex] ?? []
    const nextCompensatory = {
      ...compensatorySessions,
      [termIndex]: existingForTerm.filter((s) => s.date !== dateYmd),
    }
    update(termIndex, nextCompensatory)
    toast.success(t("batchModal.compensatorySessionRemoved"))
  }

  return {
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
  }
}
