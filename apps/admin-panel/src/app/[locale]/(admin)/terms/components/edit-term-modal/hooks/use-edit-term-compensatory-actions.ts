"use client"

import { useTranslations } from "next-intl"
import type { UseFormSetValue } from "react-hook-form"
import { toast } from "@workspace/ui/components/sonner"
import {
  resolveClassPatterns,
  type CompensatorySession,
  type GeneratedTermProposal,
  type WeekDay,
} from "@workspace/types"
import type { UpdateTermInput } from "../../../hooks/use-term-schemas"
import { recalculateEditedTerm } from "../helper/recalculate-edited-term"

interface EditTermCompensatoryActionsOptions {
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
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  setCompensatorySessions: (
    sessions: Record<number, CompensatorySession[]>
  ) => void
  setValue: UseFormSetValue<UpdateTermInput>
}

export function useEditTermCompensatoryActions(
  options: EditTermCompensatoryActionsOptions
) {
  const t = useTranslations("terms")
  const recalculate = (
    sessions: Record<number, CompensatorySession[]>,
    validateBoundary = true
  ) => {
    const active = options.proposals[options.lockedTermIndex]
    if (!active) return null
    return recalculateEditedTerm({
      proposals: options.proposals,
      lockedTermIndex: options.lockedTermIndex,
      changedIndex: options.lockedTermIndex,
      newStartDate: active.startDate,
      sessionsPerTerm: options.standardSessionsCount,
      daysOfWeek: options.daysOfWeek,
      classPatterns: options.classPatterns,
      userCustomTitles: Object.fromEntries(
        options.proposals.map((proposal, index) => [
          index,
          index === options.lockedTermIndex
            ? options.watchedTitle || options.termTitle || proposal.title
            : proposal.title,
        ])
      ),
      observeOfficialHolidays: options.observeOfficialHolidays,
      customOffDays: options.customOffDays,
      dismissedHolidays: options.dismissedHolidays,
      compensatorySessions: sessions,
      validateBoundary,
      getBoundaryError: (title) =>
        t("editModal.overlapNextTermError", { title }),
    })
  }
  const commit = (
    sessions: Record<number, CompensatorySession[]>,
    validateBoundary = true
  ) => {
    const updated = recalculate(sessions, validateBoundary)
    options.setCompensatorySessions(sessions)
    if (!updated) return
    options.setProposals(updated)
    const active = updated[options.lockedTermIndex]
    if (active) {
      options.setValue("endDate", active.endDate, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  const handleAddCompensatorySession = (
    termIndex: number,
    session: CompensatorySession
  ) => {
    const existing = options.compensatorySessions[termIndex] ?? []
    if (
      existing.some(
        (item) =>
          item.date === session.date &&
          item.patternTrack === session.patternTrack
      )
    ) {
      return
    }
    const nextSessions = {
      ...options.compensatorySessions,
      [termIndex]: [...existing, session],
    }
    options.setCompensatorySessions(nextSessions)
    try {
      const updated = recalculate(nextSessions, false)
      if (updated) {
        options.setProposals(updated)
        const active = updated[options.lockedTermIndex]
        if (active) {
          options.setValue("endDate", active.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      }
    } catch {
      // The original add flow intentionally ignores recalculation failures.
    }
    toast.success(t("batchModal.compensatorySessionAdded"))
  }

  const handleRemoveCompensatorySession = (termIndex: number, date: string) => {
    try {
      commit({
        ...options.compensatorySessions,
        [termIndex]: (options.compensatorySessions[termIndex] ?? []).filter(
          (session) => session.date !== date
        ),
      })
      toast.success(t("batchModal.compensatorySessionRemoved"))
    } catch (error) {
      if (error instanceof Error) toast.error(error.message)
    }
  }

  return { handleAddCompensatorySession, handleRemoveCompensatorySession }
}
