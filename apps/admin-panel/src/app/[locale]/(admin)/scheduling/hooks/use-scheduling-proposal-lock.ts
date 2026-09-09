"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export function useSchedulingProposalLock(proposal: Proposal) {
  const t = useTranslations("scheduling.proposalLock")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const mutation = useMutation({
    ...schedulingResource.setProposalLock.toMutation(),
    onSuccess: async (_updatedProposal, variables) => {
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.key({
          planId: proposal.planId,
          instituteId: activeInstituteId,
        }),
      })
      toast.success(
        t(variables.body.isLocked ? "lockedSuccess" : "unlockedSuccess")
      )
    },
  })

  const toggleLock = () => {
    mutation.mutate({
      planId: proposal.planId,
      proposalId: proposal.id,
      instituteId: activeInstituteId,
      body: { isLocked: !proposal.isLocked },
    })
  }

  return { toggleLock, isPending: mutation.isPending }
}
