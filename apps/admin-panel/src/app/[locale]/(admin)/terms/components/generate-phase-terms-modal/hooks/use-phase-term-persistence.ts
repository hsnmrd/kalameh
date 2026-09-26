"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  gregorianToJalali,
  type CompensatorySession,
  type GeneratedTermProposal,
} from "@workspace/types"
import { termsResource } from "@/lib/api"

interface PhaseTermPersistenceOptions {
  open: boolean
  onClose: () => void
  activeInstituteId?: string | null
  activePhaseId: string
  jalaliYear: number
  sessionsPerTerm: number
  gapDays: number
  proposals: GeneratedTermProposal[]
  setProposals: React.Dispatch<React.SetStateAction<GeneratedTermProposal[]>>
  setCustomTitles: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setStep: React.Dispatch<React.SetStateAction<1 | 2>>
  setViewMode: React.Dispatch<React.SetStateAction<"calendar" | "table">>
  setCompensatorySessions: React.Dispatch<
    React.SetStateAction<Record<number, CompensatorySession[]>>
  >
  setPinnedStartDates: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >
  setDismissedHolidays: React.Dispatch<React.SetStateAction<string[] | null>>
  setLocalCustomOffDays: React.Dispatch<React.SetStateAction<string[] | null>>
}

export function usePhaseTermPersistence({
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
  setDismissedHolidays,
  setLocalCustomOffDays,
}: PhaseTermPersistenceOptions) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const { data: existingTerms = [], isLoading: isLoadingExisting } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId || undefined,
      operatingPhaseId: activePhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && activePhaseId && open),
  })
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

  const handleClose = () => {
    setStep(1)
    setViewMode("calendar")
    setProposals([])
    setCustomTitles({})
    setCompensatorySessions({})
    setPinnedStartDates({})
    setDismissedHolidays(null)
    setLocalCustomOffDays(null)
    onClose()
  }

  const batchCreateMutation = useMutation({
    ...termsResource.batchCreatePhase.toMutation(),
    onSuccess: () => {
      toast.success(t("batchModal.success"))
      queryClient.invalidateQueries({ queryKey: termsResource.list.baseKey() })
      handleClose()
    },
  })

  const handleProceedToPreview = async () => {
    if (!activePhaseId || isLoadingExisting) {
      if (!activePhaseId) toast.error(t("batchModal.phasePlaceholder"))
      return
    }
    const isDuplicate = existingTerms.some((term) => {
      try {
        return gregorianToJalali(new Date(term.startDate)).year === jalaliYear
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
      if (result.isError) return
      if (result.data?.length) {
        setProposals(result.data)
        setCustomTitles({})
        setStep(2)
      } else if (result.data) {
        toast.error(t("batchModal.noProposals"))
      }
    } catch {
      // Global API error handling owns the notification.
    }
  }

  const handleSubmit = () => {
    if (!activePhaseId || proposals.length === 0) return
    batchCreateMutation.mutate({
      instituteId: activeInstituteId || undefined,
      operatingPhaseId: activePhaseId,
      jalaliYear,
      sessionsPerTerm,
      daysPerTerm: sessionsPerTerm,
      gapDaysBetweenTerms: gapDays,
      terms: proposals.map((proposal) => ({
        title: proposal.title.trim(),
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        isActive: true,
      })),
    })
  }

  return {
    batchCreateMutation,
    handleClose,
    handleOpenChange: (isOpen: boolean) => !isOpen && handleClose(),
    handleProceedToPreview,
    handleSubmit,
    isLoadingExisting,
    previewQuery,
  }
}
