"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { classroomsResource, schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export function useSchedulingProposalDeliveryMode(
  proposal: Proposal,
  onOpenEdit?: () => void
) {
  const t = useTranslations("scheduling.planDetails.actions")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const { data: classrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery({
      instituteId: activeInstituteId,
      isActive: true,
    }),
    enabled: Boolean(activeInstituteId),
  })

  const mutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.key({
          planId: proposal.planId,
          instituteId: activeInstituteId,
        }),
      })
      if (variables.body.deliveryMode === "ONLINE") {
        toast.success(t("switchedToOnlineSuccess"))
      } else {
        toast.success(t("switchedToInPersonSuccess"))
      }
    },
  })

  const toggleDeliveryMode = () => {
    if (proposal.deliveryMode === "IN_PERSON") {
      mutation.mutate({
        planId: proposal.planId,
        proposalId: proposal.id,
        instituteId: activeInstituteId,
        body: {
          deliveryMode: "ONLINE",
          classroomId: null,
        },
      })
    } else {
      const candidateRoom = classrooms.find((room) => {
        const matchesBranch =
          !proposal.branchId ||
          !room.branchId ||
          room.branchId === proposal.branchId
        const hasCapacity = room.capacity >= proposal.capacity
        return matchesBranch && hasCapacity
      })

      if (candidateRoom) {
        mutation.mutate({
          planId: proposal.planId,
          proposalId: proposal.id,
          instituteId: activeInstituteId,
          body: {
            deliveryMode: "IN_PERSON",
            classroomId: candidateRoom.id,
            branchId: candidateRoom.branchId ?? proposal.branchId ?? null,
          },
        })
      } else {
        toast.info(t("selectClassroomInEditHint"))
        onOpenEdit?.()
      }
    }
  }

  return {
    toggleDeliveryMode,
    isPending: mutation.isPending,
  }
}
