"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  hasTermDateConflict,
  checkTermsDateOverlap,
  type GeneratedTermProposal,
} from "@workspace/types"
import { useRouter } from "@/i18n/routing"
import { termsResource } from "@/lib/api"

interface PhaseTermPersistenceOptions {
  activeInstituteId?: string | null
  activePhaseId: string
  jalaliYear: number
  sessionsPerTerm: number
  gapDays: number
  proposals: GeneratedTermProposal[]
  setProposals: (proposals: GeneratedTermProposal[]) => void
  setCustomTitles: (titles: Record<number, string>) => void
  reset?: () => void
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
  reset,
}: PhaseTermPersistenceOptions) {
  const t = useTranslations("terms")
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: existingTerms = [], isLoading: isLoadingExisting } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId || undefined,
    }),
    enabled: Boolean(activeInstituteId),
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
      reset?.()
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
    try {
      const result = await previewQuery.refetch()
      if (result.isError) return
      if (result.data?.length) {
        setProposals(result.data)
        setCustomTitles({})
        router.push("/terms/generate/preview")
      } else if (result.data) {
        toast.error(t("batchModal.noProposals"))
      }
    } catch {
      // Global API error handling owns the notification.
    }
  }

  const handleSubmit = () => {
    if (!activePhaseId || proposals.length === 0) return

    // Check conflicts with existing terms
    for (const proposal of proposals) {
      const conflicting = existingTerms.find((existing) =>
        hasTermDateConflict(proposal, existing)
      )
      if (conflicting) {
        toast.error(
          t("batchModal.termDateConflict", {
            term: proposal.title,
            conflictingTerm: conflicting.title,
          })
        )
        return
      }
    }

    // Check internal conflicts among proposals
    const internalConflict = checkTermsDateOverlap(proposals)
    if (internalConflict.hasConflict && internalConflict.conflictingPair) {
      const [termA, termB] = internalConflict.conflictingPair
      toast.error(
        t("batchModal.termDateConflict", {
          term: termA.title,
          conflictingTerm: termB.title,
        })
      )
      return
    }

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
    reset?.()
    router.push("/terms")
  }

  return {
    batchCreateMutation,
    handleProceedToPreview,
    handleSubmit,
    handleCancel,
    isLoadingExisting,
    previewQuery,
    existingTerms,
  }
}
