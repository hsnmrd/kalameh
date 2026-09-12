"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  gregorianToJalali,
  recalculatePhaseTerms,
  type GeneratedTermProposal,
  type WeekDay,
} from "@workspace/types"
import { operatingPhasesResource, termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface UseGeneratePhaseTermsProps {
  open: boolean
  onClose: () => void
}

export function useGeneratePhaseTerms({
  open,
  onClose,
}: UseGeneratePhaseTermsProps) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
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
  const [daysPerTerm, setDaysPerTerm] = React.useState<number>(45)
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

  const phaseOptions: ComboboxOption[] = React.useMemo(() => {
    return phases.map((phase) => ({
      value: phase.id,
      label: phase.title,
    }))
  }, [phases])

  const activePhaseId = selectedPhaseId || phases[0]?.id || ""

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
      daysPerTerm,
      sessionsPerTerm: daysPerTerm,
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
        daysPerTerm,
        sessionsPerTerm: daysPerTerm,
        daysOfWeek,
        gapDaysBetweenTerms: gapDays,
        userCustomTitles: customTitles,
      })
      setProposals(updated)
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

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
      daysPerTerm,
      sessionsPerTerm: daysPerTerm,
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
    onClose()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
  }

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
    daysPerTerm,
    setDaysPerTerm,
    gapDays,
    setGapDays,
    proposals,
    setProposals,
    phaseOptions,
    previewQuery,
    batchCreateMutation,
    isLoadingExisting,
    handleProceedToPreview,
    handleTitleChange,
    handleStartDateChange,
    handleSubmit,
    handleClose,
    handleOpenChange,
  }
}
