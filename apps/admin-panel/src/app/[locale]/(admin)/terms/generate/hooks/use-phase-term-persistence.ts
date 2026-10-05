"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { gregorianToJalali, type GeneratedTermProposal } from "@workspace/types"
import { useRouter } from "@/i18n/routing"
import { termsResource } from "@/lib/api"

interface PhaseTermPersistenceOptions {
  activeInstituteId?: string | null
  activePhaseId: string
  jalaliYear: number
  sessionsPerTerm: number
  gapDays: number
  proposals: GeneratedTermProposal[]
  setProposals: React.Dispatch<React.SetStateAction<GeneratedTermProposal[]>>
  setCustomTitles: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setStep: React.Dispatch<React.SetStateAction<1 | 2>>
}

export function usePhaseTermPersistence({
  activeInstituteId,
  activePhaseId,
  jalaliYear,
  sessionsPerTerm,
  gapDays,
  proposals,
  setProposals,
  setCustomTitles,
  setStep,
}: PhaseTermPersistenceOptions) {
  const t = useTranslations("terms")
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: existingTerms = [], isLoading: isLoadingExisting } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId || undefined,
      operatingPhaseId: activePhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && activePhaseId),
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

  const batchCreateMutation = useMutation({
    ...termsResource.batchCreatePhase.toMutation(),
    onSuccess: () => {
      toast.success(t("batchModal.success"))
      queryClient.invalidateQueries({ queryKey: termsResource.list.baseKey() })
      router.push("/terms")
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

  const handleCancel = () => {
    router.push("/terms")
  }

  return {
    batchCreateMutation,
    handleProceedToPreview,
    handleSubmit,
    handleCancel,
    isLoadingExisting,
    previewQuery,
  }
}
