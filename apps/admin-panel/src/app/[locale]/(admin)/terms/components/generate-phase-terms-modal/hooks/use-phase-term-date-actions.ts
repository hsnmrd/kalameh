"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type InstituteCustomOffDay,
  type OperatingPhase,
  type WeekDay,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { recalculateProposals } from "../helper/recalculate-proposals"

interface PhaseTermDateActionsOptions {
  activeInstituteId?: string | null
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
  rawCustomOffDays?: InstituteCustomOffDay[]
  dismissedHolidays: string[]
  setDismissedHolidays: React.Dispatch<React.SetStateAction<string[] | null>>
  setLocalCustomOffDays: React.Dispatch<React.SetStateAction<string[] | null>>
  compensatorySessions: Record<number, CompensatorySession[]>
  pinnedStartDates: Record<number, string>
  setPinnedStartDates: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >
}

export function usePhaseTermDateActions({
  activeInstituteId,
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
  rawCustomOffDays,
  dismissedHolidays,
  setDismissedHolidays,
  setLocalCustomOffDays,
  compensatorySessions,
  pinnedStartDates,
  setPinnedStartDates,
}: PhaseTermDateActionsOptions) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const daysOfWeek = React.useMemo(
    () =>
      (phases.find((phase) => phase.id === activePhaseId)?.daysOfWeek?.length
        ? phases.find((phase) => phase.id === activePhaseId)?.daysOfWeek
        : ["SATURDAY", "MONDAY", "WEDNESDAY"]) as WeekDay[],
    [activePhaseId, phases]
  )

  const recalculate = React.useCallback(
    (
      changedIndex: number,
      newStartDate: string,
      nextCustomOffDays = customOffDays,
      nextDismissedHolidays = dismissedHolidays
    ) =>
      recalculateProposals({
        proposals,
        changedIndex,
        newStartDate,
        sessionsPerTerm,
        daysOfWeek,
        classPatterns,
        gapDays,
        customTitles,
        observeOfficialHolidays,
        customOffDays: nextCustomOffDays,
        dismissedHolidays: nextDismissedHolidays,
        compensatorySessions,
        pinnedStartDates,
      }),
    [
      proposals,
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
    ]
  )

  const reportError = (error: unknown) => {
    toast.error(
      error instanceof Error ? error.message : t("batchModal.recalculateError")
    )
  }

  const handleStartDateChange = (index: number, newStartDate: string) => {
    try {
      setProposals(recalculate(index, newStartDate))
      setPinnedStartDates((current) => ({
        ...current,
        [index]: newStartDate,
      }))
    } catch (error) {
      reportError(error)
    }
  }

  const handleToggleHoliday = (date: string) => {
    try {
      const nextDismissed = dismissedHolidays.includes(date)
        ? dismissedHolidays.filter((item) => item !== date)
        : [...dismissedHolidays, date]
      setDismissedHolidays(nextDismissed)
      if (proposals[0]) {
        setProposals(
          recalculate(0, proposals[0].startDate, customOffDays, nextDismissed)
        )
        toast.success(t("batchModal.holidayToggled"))
      }
    } catch (error) {
      reportError(error)
    }
  }

  const createCustomOffDayMutation = useMutation({
    ...institutesResource.createCustomOffDay.toMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
      setLocalCustomOffDays(null)
    },
  })
  const deleteCustomOffDayMutation = useMutation({
    ...institutesResource.deleteCustomOffDay.toMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
      setLocalCustomOffDays(null)
    },
  })

  const handleToggleCustomOffDay = (date: string) => {
    try {
      const isCurrentlyOff = customOffDays.includes(date)
      const nextCustomOffDays = isCurrentlyOff
        ? customOffDays.filter((item) => item !== date)
        : [...customOffDays, date]
      setLocalCustomOffDays(nextCustomOffDays)
      if (proposals[0]) {
        setProposals(recalculate(0, proposals[0].startDate, nextCustomOffDays))
      }
      if (!activeInstituteId) return
      if (isCurrentlyOff) {
        const existing = rawCustomOffDays?.find((item) => item.date === date)
        if (existing) {
          deleteCustomOffDayMutation.mutate({
            id: activeInstituteId,
            offDayId: existing.id,
          })
        }
        toast.success(t("batchModal.customOffDayRemoved"))
      } else {
        createCustomOffDayMutation.mutate({
          id: activeInstituteId,
          body: {
            date,
            title: t("batchModal.defaultCustomOffDayTitle"),
          },
        })
        toast.success(t("batchModal.customOffDayAdded"))
      }
    } catch (error) {
      reportError(error)
    }
  }

  return {
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
  }
}
