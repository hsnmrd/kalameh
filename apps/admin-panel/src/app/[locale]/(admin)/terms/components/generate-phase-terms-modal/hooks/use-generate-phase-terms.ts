"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  gregorianToJalali,
  recalculatePhaseTerms,
  resolveClassPatterns,
  type GeneratedTermProposal,
  type WeekDay,
  type CompensatorySession,
} from "@workspace/types"
import {
  operatingPhasesResource,
  termsResource,
  institutesResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

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
  const queryClient = useQueryClient()

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

  // Fetch existing terms for checking duplicate phase & academic year
  const { data: existingPhaseTerms = [], isLoading: isLoadingExisting } =
    useQuery({
      ...termsResource.list.toQuery({
        instituteId: activeInstituteId,
        operatingPhaseId: activePhaseId || undefined,
      }),
      enabled: Boolean(activeInstituteId && activePhaseId && open),
    })

  // Preview query
  const previewQuery = useQuery({
    ...termsResource.previewPhase.toQuery({
      operatingPhaseId: activePhaseId,
      jalaliYear,
      sessionsPerTerm,
      daysPerTerm: sessionsPerTerm,
      gapDays,
    }),
    enabled: false,
  })

  const handleProceedToPreview = async () => {
    if (!activePhaseId || isLoadingExisting) {
      if (!activePhaseId) {
        toast.error(t("batchModal.phasePlaceholder"))
      }
      return
    }

    const isDuplicate = existingPhaseTerms.some((term) => {
      try {
        const startYear = gregorianToJalali(new Date(term.startDate)).year
        return startYear === jalaliYear
      } catch {
        return false
      }
    })

    if (isDuplicate) {
      toast.error(t("batchModal.duplicatePhaseYear"))
      return
    }

    try {
      const result = await previewQuery.refetch()
      if (result.isError) {
        return
      }
      const data = result.data
      if (data && data.length > 0) {
        setProposals(data)
        setCustomTitles({})
        setStep(2)
      } else if (data && data.length === 0) {
        toast.error(t("batchModal.noProposals"))
      }
    } catch {
      // Backend error handled by global error handler
    }
  }

  const handleTitleChange = (index: number, newTitle: string) => {
    setCustomTitles((prev) => ({ ...prev, [index]: newTitle }))
    setProposals((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, title: newTitle } : item
      )
    )
  }

  const handleStartDateChange = (index: number, newStartDate: string) => {
    try {
      const selectedPhase = phases.find((p) => p.id === activePhaseId)
      const daysOfWeek = (
        selectedPhase?.daysOfWeek && selectedPhase.daysOfWeek.length > 0
          ? selectedPhase.daysOfWeek
          : ["SATURDAY", "MONDAY", "WEDNESDAY"]
      ) as WeekDay[]

      const updated = recalculatePhaseTerms({
        proposals,
        changedIndex: index,
        newStartDate,
        sessionsPerTerm,
        daysPerTerm: sessionsPerTerm,
        daysOfWeek,
        classPatterns: activeClassPatterns,
        gapDaysBetweenTerms: gapDays,
        userCustomTitles: customTitles,
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays: activeDismissedHolidays,
        compensatorySessions,
        pinnedStartDates,
      })
      setProposals(updated)
      // Record the pin so subsequent global recalculations (holiday toggles,
      // custom off-days) do not overwrite the user's manual choice.
      setPinnedStartDates((prev) => ({ ...prev, [index]: newStartDate }))
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  const handleToggleHoliday = (dateYmd: string) => {
    try {
      const isCurrentlyDismissed = activeDismissedHolidays.includes(dateYmd)
      const nextDismissed = isCurrentlyDismissed
        ? activeDismissedHolidays.filter((d) => d !== dateYmd)
        : [...activeDismissedHolidays, dateYmd]

      setDismissedHolidaysOverride(nextDismissed)

      if (proposals.length > 0) {
        const selectedPhase = phases.find((p) => p.id === activePhaseId)
        const daysOfWeek = (
          selectedPhase?.daysOfWeek && selectedPhase.daysOfWeek.length > 0
            ? selectedPhase.daysOfWeek
            : ["SATURDAY", "MONDAY", "WEDNESDAY"]
        ) as WeekDay[]

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: 0,
          newStartDate: proposals[0]!.startDate,
          sessionsPerTerm,
          daysPerTerm: sessionsPerTerm,
          daysOfWeek,
          classPatterns: activeClassPatterns,
          gapDaysBetweenTerms: gapDays,
          userCustomTitles: customTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: nextDismissed,
          compensatorySessions,
          pinnedStartDates,
        })
        setProposals(updated)
        toast.success(t("batchModal.holidayToggled"))
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  const handleToggleCustomOffDay = (dateYmd: string) => {
    try {
      const isCurrentlyOff = customOffDays.includes(dateYmd)
      const nextCustomOffDays = isCurrentlyOff
        ? customOffDays.filter((d) => d !== dateYmd)
        : [...customOffDays, dateYmd]

      setLocalCustomOffDays(nextCustomOffDays)

      if (proposals.length > 0) {
        const selectedPhase = phases.find((p) => p.id === activePhaseId)
        const daysOfWeek = (
          selectedPhase?.daysOfWeek && selectedPhase.daysOfWeek.length > 0
            ? selectedPhase.daysOfWeek
            : ["SATURDAY", "MONDAY", "WEDNESDAY"]
        ) as WeekDay[]

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: 0,
          newStartDate: proposals[0]!.startDate,
          sessionsPerTerm,
          daysPerTerm: sessionsPerTerm,
          daysOfWeek,
          classPatterns: activeClassPatterns,
          gapDaysBetweenTerms: gapDays,
          userCustomTitles: customTitles,
          observeOfficialHolidays,
          customOffDays: nextCustomOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions,
          pinnedStartDates,
        })
        setProposals(updated)
      }

      if (activeInstituteId) {
        if (isCurrentlyOff) {
          const existing = rawCustomOffDays?.find((d) => d.date === dateYmd)
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
              date: dateYmd,
              title: t("batchModal.defaultCustomOffDayTitle"),
            },
          })
          toast.success(t("batchModal.customOffDayAdded"))
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  const handleAddCompensatorySession = (
    termIndex: number,
    session: CompensatorySession
  ) => {
    try {
      const existingForTerm = compensatorySessions[termIndex] ?? []
      if (
        existingForTerm.some(
          (s) =>
            s.date === session.date && s.patternTrack === session.patternTrack
        )
      ) {
        return
      }
      const nextForTerm = [...existingForTerm, session]
      const nextCompensatory = {
        ...compensatorySessions,
        [termIndex]: nextForTerm,
      }
      setCompensatorySessions(nextCompensatory)

      if (proposals.length > termIndex) {
        const selectedPhase = phases.find((p) => p.id === activePhaseId)
        const daysOfWeek = (
          selectedPhase?.daysOfWeek && selectedPhase.daysOfWeek.length > 0
            ? selectedPhase.daysOfWeek
            : ["SATURDAY", "MONDAY", "WEDNESDAY"]
        ) as WeekDay[]

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: termIndex,
          newStartDate: proposals[termIndex]!.startDate,
          sessionsPerTerm,
          daysPerTerm: sessionsPerTerm,
          daysOfWeek,
          classPatterns: activeClassPatterns,
          gapDaysBetweenTerms: gapDays,
          userCustomTitles: customTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions: nextCompensatory,
          pinnedStartDates,
        })
        setProposals(updated)
        toast.success(t("batchModal.compensatorySessionAdded"))
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  const handleRemoveCompensatorySession = (
    termIndex: number,
    dateYmd: string
  ) => {
    try {
      const existingForTerm = compensatorySessions[termIndex] ?? []
      const nextForTerm = existingForTerm.filter((s) => s.date !== dateYmd)
      const nextCompensatory = {
        ...compensatorySessions,
        [termIndex]: nextForTerm,
      }
      setCompensatorySessions(nextCompensatory)

      if (proposals.length > termIndex) {
        const selectedPhase = phases.find((p) => p.id === activePhaseId)
        const daysOfWeek = (
          selectedPhase?.daysOfWeek && selectedPhase.daysOfWeek.length > 0
            ? selectedPhase.daysOfWeek
            : ["SATURDAY", "MONDAY", "WEDNESDAY"]
        ) as WeekDay[]

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: termIndex,
          newStartDate: proposals[termIndex]!.startDate,
          sessionsPerTerm,
          daysPerTerm: sessionsPerTerm,
          daysOfWeek,
          classPatterns: activeClassPatterns,
          gapDaysBetweenTerms: gapDays,
          userCustomTitles: customTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions: nextCompensatory,
          pinnedStartDates,
        })
        setProposals(updated)
        toast.success(t("batchModal.compensatorySessionRemoved"))
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  // Custom off-day mutations
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

  // Batch create mutation
  const batchCreateMutation = useMutation({
    ...termsResource.batchCreatePhase.toMutation(),
    onSuccess: () => {
      toast.success(t("batchModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      handleClose()
    },
  })

  const handleSubmit = () => {
    if (!activePhaseId || proposals.length === 0) return

    batchCreateMutation.mutate({
      instituteId: activeInstituteId || undefined,
      operatingPhaseId: activePhaseId,
      jalaliYear,
      sessionsPerTerm,
      daysPerTerm: sessionsPerTerm,
      gapDaysBetweenTerms: gapDays,
      terms: proposals.map((p) => ({
        title: p.title.trim(),
        startDate: p.startDate,
        endDate: p.endDate,
        isActive: true,
      })),
    })
  }

  const handleClose = () => {
    setStep(1)
    setViewMode("calendar")
    setProposals([])
    setCustomTitles({})
    setCompensatorySessions({})
    setPinnedStartDates({})
    setDismissedHolidaysOverride(null)
    setLocalCustomOffDays(null)
    onClose()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
  }

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
