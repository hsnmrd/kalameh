"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  hasTermDateConflict,
  checkTermsDateOverlap,
  hasFutureDays,
  isPhaseInPast,
  type GeneratedTermProposal,
} from "@workspace/types"
import { useRouter } from "@/i18n/routing"
import { termsResource } from "@/lib/api"

interface PhaseTermPersistenceOptions {
  activeInstituteId?: string | null
  activePhaseId: string
  selectedPhaseMonths?: number[]
  jalaliYear: number
  sessionsPerTerm: number
  gapDays: number
  proposals: GeneratedTermProposal[]
  setProposals: (proposals: GeneratedTermProposal[]) => void
  setCustomTitles: (titles: Record<number, string>) => void
  setSelectedPhaseId?: (phaseId: string) => void
  reset?: () => void
}

export function usePhaseTermPersistence({
  activeInstituteId,
  activePhaseId,
  selectedPhaseMonths,
  jalaliYear,
  sessionsPerTerm,
  gapDays,
  proposals,
  setProposals,
  setCustomTitles,
  setSelectedPhaseId,
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
      toast.success(t("batchModal.success"))
      queryClient.invalidateQueries({ queryKey: termsResource.list.baseKey() })
      router.push("/terms")
      reset?.()
    },
  })

  const handleProceedToPreview = async () => {
    if (!activePhaseId || isLoadingExisting) {
      if (!activePhaseId) toast.error(t("batchModal.phasePlaceholder"))
      return false
    }

    if (
      selectedPhaseMonths &&
      selectedPhaseMonths.length > 0 &&
      isPhaseInPast(selectedPhaseMonths, jalaliYear)
    ) {
      toast.error(t("batchModal.pastMonthsNotAllowed"))
      return false
    }

    try {
      const data = await queryClient.fetchQuery({
        ...termsResource.previewPhase.toQuery({
          operatingPhaseId: activePhaseId,
          jalaliYear,
          sessionsPerTerm,
          daysPerTerm: sessionsPerTerm,
          gapDays,
        }),
      })

      if (data && data.length > 0) {
        setSelectedPhaseId?.(activePhaseId)
        setProposals(data)
        setCustomTitles({})
        router.push("/terms/generate")
        return true
      } else if (data) {
        toast.error(t("batchModal.noProposals"))
        return false
      }
      return false
    } catch {
      // Global API error handling owns the notification.
      return false
    }
  }

  const handleSubmit = () => {
    if (!activePhaseId || proposals.length === 0) return

    // Check that every proposal has at least one day in the future
    for (const proposal of proposals) {
      if (!hasFutureDays(proposal)) {
        toast.error(t("createModal.pastTermNotAllowed"))
        return
      }
    }

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
