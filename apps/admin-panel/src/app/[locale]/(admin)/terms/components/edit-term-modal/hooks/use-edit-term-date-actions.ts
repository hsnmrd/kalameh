"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseFormSetValue } from "react-hook-form"
import { toast } from "@workspace/ui/components/sonner"
import {
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type InstituteCustomOffDay,
  type WeekDay,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"
import type { UpdateTermInput } from "../../../hooks/use-term-schemas"
import { recalculateEditedTerm } from "../helper/recalculate-edited-term"

interface EditTermDateActionsOptions {
  activeInstituteId?: string | null
  proposals: GeneratedTermProposal[]
  setProposals: (proposals: GeneratedTermProposal[]) => void
  lockedTermIndex: number
  standardSessionsCount: number
  daysOfWeek: WeekDay[]
  classPatterns: ReturnType<typeof resolveClassPatterns>
  watchedTitle?: string
  termTitle?: string
  observeOfficialHolidays: boolean
  customOffDays: string[]
  rawCustomOffDays?: InstituteCustomOffDay[]
  dismissedHolidays: string[]
  setDismissedHolidays: (holidays: string[]) => void
  setLocalCustomOffDays: (days: string[]) => void
  compensatorySessions: Record<number, CompensatorySession[]>
  setValue: UseFormSetValue<UpdateTermInput>
}

export function useEditTermDateActions(options: EditTermDateActionsOptions) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const getBoundaryError = (title: string) =>
    t("editModal.overlapNextTermError", { title })
  const titles = Object.fromEntries(
    options.proposals.map((proposal, index) => [
      index,
      index === options.lockedTermIndex
        ? options.watchedTitle || options.termTitle || proposal.title
        : proposal.title,
    ])
  )
  const recalculate = (
    changedIndex: number,
    startDate: string,
    customOffDays = options.customOffDays,
    dismissedHolidays = options.dismissedHolidays,
    sessionsPerTerm = options.standardSessionsCount,
    includeTitles = true
  ) =>
    recalculateEditedTerm({
      proposals: options.proposals,
      lockedTermIndex: options.lockedTermIndex,
      changedIndex,
      newStartDate: startDate,
      sessionsPerTerm,
      daysOfWeek: options.daysOfWeek,
      classPatterns: options.classPatterns,
      userCustomTitles: includeTitles ? titles : undefined,
      observeOfficialHolidays: options.observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
      compensatorySessions: options.compensatorySessions,
      getBoundaryError,
    })
  const syncDates = (
    updated: GeneratedTermProposal[],
    includeStart = false
  ) => {
    const active = updated[options.lockedTermIndex]
    if (!active) return
    if (includeStart) {
      options.setValue("startDate", active.startDate, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    options.setValue("endDate", active.endDate, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }
  const reportError = (error: unknown) =>
    toast.error(
      error instanceof Error ? error.message : t("batchModal.recalculateError")
    )

  const handleStartDateChange = (index: number, date: string) => {
    if (index !== options.lockedTermIndex) return
    try {
      const updated = recalculate(index, date)
      options.setProposals(updated)
      syncDates(updated, true)
    } catch (error) {
      reportError(error)
    }
  }

  const handleToggleHoliday = (date: string) => {
    try {
      const dismissed = options.dismissedHolidays.includes(date)
        ? options.dismissedHolidays.filter((item) => item !== date)
        : [...options.dismissedHolidays, date]
      const active = options.proposals[options.lockedTermIndex]
      if (active) {
        const updated = recalculate(
          options.lockedTermIndex,
          active.startDate,
          options.customOffDays,
          dismissed
        )
        options.setDismissedHolidays(dismissed)
        options.setProposals(updated)
        syncDates(updated)
      } else {
        options.setDismissedHolidays(dismissed)
      }
      toast.success(t("batchModal.holidayToggled"))
    } catch (error) {
      reportError(error)
    }
  }

  const createMutation = useMutation({
    ...institutesResource.createCustomOffDay.toMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      }),
  })
  const deleteMutation = useMutation({
    ...institutesResource.deleteCustomOffDay.toMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      }),
  })

  const handleToggleCustomOffDay = (date: string) => {
    const isOff = options.customOffDays.includes(date)
    const days = isOff
      ? options.customOffDays.filter((item) => item !== date)
      : [...options.customOffDays, date]
    try {
      const active = options.proposals[options.lockedTermIndex]
      if (active) {
        const updated = recalculate(
          options.lockedTermIndex,
          active.startDate,
          days,
          options.dismissedHolidays,
          active.sessionsCount || 18,
          false
        )
        options.setLocalCustomOffDays(days)
        options.setProposals(updated)
        syncDates(updated)
      } else {
        options.setLocalCustomOffDays(days)
      }
    } catch (error) {
      reportError(error)
      return
    }
    if (!options.activeInstituteId) return
    if (isOff) {
      const existing = options.rawCustomOffDays?.find(
        (item) => item.date === date
      )
      if (existing) {
        deleteMutation.mutate({
          id: options.activeInstituteId,
          offDayId: existing.id,
        })
      }
      toast.success(t("batchModal.customOffDayRemoved"))
    } else {
      createMutation.mutate({
        id: options.activeInstituteId,
        body: { date, title: t("batchModal.defaultCustomOffDayTitle") },
      })
      toast.success(t("batchModal.customOffDayAdded"))
    }
  }

  return {
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
  }
}
