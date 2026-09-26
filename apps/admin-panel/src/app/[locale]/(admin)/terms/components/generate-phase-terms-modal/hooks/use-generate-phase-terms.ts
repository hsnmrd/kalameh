"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  gregorianToJalali,
  resolveClassPatterns,
  type GeneratedTermProposal,
  type WeekDay,
  type CompensatorySession,
} from "@workspace/types"
import { operatingPhasesResource, institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePhaseTermCompensatoryActions } from "./use-phase-term-compensatory-actions"
import { usePhaseTermDateActions } from "./use-phase-term-date-actions"
import { usePhaseTermPersistence } from "./use-phase-term-persistence"

export interface UseGeneratePhaseTermsOptions {
  open: boolean
  onClose: () => void
}

export function useGeneratePhaseTerms({
  open,
  onClose,
}: UseGeneratePhaseTermsOptions) {
  const t = useTranslations("terms")
  const { activeInstituteId } = useActiveInstitute()

  const currentJYear = React.useMemo(() => {
    return gregorianToJalali(new Date()).year
  }, [])

  const [step, setStep] = React.useState<1 | 2>(1)
  const [viewMode, setViewMode] = React.useState<"calendar" | "table">(
    "calendar"
  )
  const [selectedPhaseId, setSelectedPhaseId] = React.useState<string>("")
  const [jalaliYear, setJalaliYear] = React.useState<number>(currentJYear)
  const [sessionsPerTerm, setSessionsPerTerm] = React.useState<number>(18)
  const [gapDays, setGapDays] = React.useState<number>(2)
  const [proposals, setProposals] = React.useState<GeneratedTermProposal[]>([])
  const [customTitles, setCustomTitles] = React.useState<
    Record<number, string>
  >({})

  // Fetch institute operating phases
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch institute details for holiday observance preference
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch custom institute off-days
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  const [dismissedHolidaysOverride, setDismissedHolidaysOverride] =
    React.useState<string[] | null>(null)
  const [localCustomOffDays, setLocalCustomOffDays] = React.useState<
    string[] | null
  >(null)
  const [compensatorySessions, setCompensatorySessions] = React.useState<
    Record<number, CompensatorySession[]>
  >({})
  const [pinnedStartDates, setPinnedStartDates] = React.useState<
    Record<number, string>
  >({})

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
    setCustomTitles((prev) => ({ ...prev, [index]: newTitle }))
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
    handleClose,
    handleOpenChange,
    handleProceedToPreview,
    handleSubmit,
    isLoadingExisting,
    previewQuery,
  } = usePhaseTermPersistence({
    open,
    onClose,
    activeInstituteId,
    activePhaseId,
    jalaliYear,
    sessionsPerTerm,
    gapDays,
    proposals,
    setProposals,
    setCustomTitles,
    setStep,
    setViewMode,
    setCompensatorySessions,
    setPinnedStartDates,
    setDismissedHolidays: setDismissedHolidaysOverride,
    setLocalCustomOffDays,
  })

  const hasAnySessionImbalance = React.useMemo(() => {
    return proposals.some((p) => p.hasSessionImbalance)
  }, [proposals])

  return {
    t,
    step,
    setStep,
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
    handleClose,
    handleOpenChange,
  }
}
