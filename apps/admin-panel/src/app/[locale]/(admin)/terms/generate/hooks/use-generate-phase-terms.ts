"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  resolveClassPatterns,
  hasTermDateConflict,
  type WeekDay,
} from "@workspace/types"
import { operatingPhasesResource, institutesResource } from "@/lib/api"
import { useActiveInstitute, usePhaseTermsGenerateStore } from "@/lib/stores"
import { usePhaseTermCompensatoryActions } from "./use-phase-term-compensatory-actions"
import { usePhaseTermDateActions } from "./use-phase-term-date-actions"
import { usePhaseTermPersistence } from "./use-phase-term-persistence"

export function useGeneratePhaseTerms() {
  const t = useTranslations("terms")
  const { activeInstituteId } = useActiveInstitute()

  const {
    selectedPhaseId,
    setSelectedPhaseId,
    jalaliYear,
    setJalaliYear,
    sessionsPerTerm,
    setSessionsPerTerm,
    gapDays,
    setGapDays,
    proposals,
    setProposals,
    customTitles,
    setCustomTitles,
    pinnedStartDates,
    setPinnedStartDates,
    compensatorySessions,
    setCompensatorySessions,
    localCustomOffDays,
    setLocalCustomOffDays,
    dismissedHolidaysOverride,
    setDismissedHolidaysOverride,
    viewMode,
    setViewMode,
    reset,
  } = usePhaseTermsGenerateStore()

  // Fetch institute operating phases
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId),
  })

  // Fetch institute details for holiday observance preference
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  // Fetch custom institute off-days
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const customOffDays = React.useMemo(() => {
    if (localCustomOffDays !== null) return localCustomOffDays
    return rawCustomOffDays?.map((d) => d.date) ?? []
  }, [localCustomOffDays, rawCustomOffDays])
  const activeDismissedHolidays =
    dismissedHolidaysOverride ?? institute?.dismissedHolidays ?? []
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  const phaseOptions: ComboboxOption[] = React.useMemo(() => {
    return phases.map((phase) => ({
      value: phase.id,
      label: phase.title,
    }))
  }, [phases])

  const activePhaseId = selectedPhaseId || phases[0]?.id || ""
  const selectedPhase = phases.find((p) => p.id === activePhaseId)

  const activeClassPatterns = React.useMemo(() => {
    return resolveClassPatterns(
      selectedPhase?.daysOfWeek as WeekDay[] | undefined
    )
  }, [selectedPhase?.daysOfWeek])

  const handleTitleChange = (index: number, newTitle: string) => {
    setCustomTitles({ ...customTitles, [index]: newTitle })
    setProposals((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, title: newTitle } : item
      )
    )
  }

  const {
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
  } = usePhaseTermDateActions({
    activeInstituteId,
    phases,
    activePhaseId,
    proposals,
    setProposals,
    sessionsPerTerm,
    gapDays,
    customTitles,
    classPatterns: activeClassPatterns,
    observeOfficialHolidays,
    customOffDays,
    rawCustomOffDays,
    dismissedHolidays: activeDismissedHolidays,
    setDismissedHolidays: setDismissedHolidaysOverride,
    setLocalCustomOffDays,
    compensatorySessions,
    pinnedStartDates,
    setPinnedStartDates,
  })

  const { handleAddCompensatorySession, handleRemoveCompensatorySession } =
    usePhaseTermCompensatoryActions({
      phases,
      activePhaseId,
      proposals,
      setProposals,
      sessionsPerTerm,
      gapDays,
      customTitles,
      classPatterns: activeClassPatterns,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays: activeDismissedHolidays,
      compensatorySessions,
      setCompensatorySessions,
      pinnedStartDates,
    })

  const {
    batchCreateMutation,
    handleCancel,
    handleProceedToPreview,
    handleSubmit,
    isLoadingExisting,
    previewQuery,
    existingTerms,
  } = usePhaseTermPersistence({
    activeInstituteId,
    activePhaseId,
    jalaliYear,
    sessionsPerTerm,
    gapDays,
    proposals,
    setProposals,
    setCustomTitles,
    reset,
  })

  const dateConflicts = React.useMemo(() => {
    const list: Array<{
      termTitle: string
      conflictingTitle: string
      termIndex: number
    }> = []

    proposals.forEach((proposal, index) => {
      // Check against existing terms in operating phase
      existingTerms.forEach((existing) => {
        if (hasTermDateConflict(proposal, existing)) {
          list.push({
            termTitle: proposal.title,
            conflictingTitle: existing.title,
            termIndex: index,
          })
        }
      })

      // Check against other proposals
      proposals.forEach((other, otherIndex) => {
        if (index !== otherIndex && hasTermDateConflict(proposal, other)) {
          list.push({
            termTitle: proposal.title,
            conflictingTitle: other.title,
            termIndex: index,
          })
        }
      })
    })

    return list
  }, [proposals, existingTerms])

  const hasAnyDateConflict = dateConflicts.length > 0

  const hasAnySessionImbalance = React.useMemo(() => {
    return proposals.some((p) => p.hasSessionImbalance)
  }, [proposals])

  return {
    t,
    viewMode,
    setViewMode,
    selectedPhaseId,
    setSelectedPhaseId,
    activePhaseId,
    jalaliYear,
    setJalaliYear,
    sessionsPerTerm,
    setSessionsPerTerm,
    daysPerTerm: sessionsPerTerm,
    setDaysPerTerm: setSessionsPerTerm,
    activeClassPatterns,
    gapDays,
    setGapDays,
    proposals,
    setProposals,
    hasAnySessionImbalance,
    dateConflicts,
    hasAnyDateConflict,
    existingTerms,
    phaseOptions,
    previewQuery,
    batchCreateMutation,
    isLoadingExisting,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays: activeDismissedHolidays,
    activeDismissedHolidays,
    compensatorySessions,
    handleProceedToPreview,
    handleTitleChange,
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
    handleSubmit,
    handleCancel,
    reset,
  }
}
