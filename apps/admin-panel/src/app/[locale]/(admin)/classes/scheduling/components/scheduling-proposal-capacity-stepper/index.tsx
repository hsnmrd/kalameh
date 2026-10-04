"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Minus, Plus, Users } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingProposalCapacityStepperProps {
  proposal: Proposal
  canEdit: boolean
}

export function SchedulingProposalCapacityStepper({
  proposal,
  canEdit,
}: SchedulingProposalCapacityStepperProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const maxCapacity = proposal.classroom?.capacity ?? proposal.capacity
  const minCapacity = 1

  const [capacityDraft, setCapacityDraft] = React.useState<{
    proposalId: string
    sourceCapacity: number
    value: number
  } | null>(null)
  const capacity =
    capacityDraft?.proposalId === proposal.id &&
    capacityDraft.sourceCapacity === proposal.capacity
      ? capacityDraft.value
      : proposal.capacity
  const setCapacity = (value: number) =>
    setCapacityDraft({
      proposalId: proposal.id,
      sourceCapacity: proposal.capacity,
      value,
    })

  const updateMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.key({
          planId: proposal.planId,
          instituteId: activeInstituteId,
        }),
      })
    },
    onError: () => {
      setCapacity(proposal.capacity)
    },
  })

  const isEditable = canEdit && !proposal.isLocked && !proposal.publishedClassId

  const handleDelta = (delta: number) => {
    if (!isEditable || updateMutation.isPending) return
    const nextCapacity = capacity + delta
    if (nextCapacity < minCapacity || nextCapacity > maxCapacity) return

    setCapacity(nextCapacity)
    updateMutation.mutate({
      planId: proposal.planId,
      proposalId: proposal.id,
      instituteId: activeInstituteId,
      body: {
        capacity: nextCapacity,
      },
    })
  }

  return (
    <div
      className="flex items-center justify-between gap-1 rounded-lg border border-border/50 bg-muted/20 px-1.5 py-1 text-[11px]"
      aria-label={t("calendarView.capacityLabel", {
        current: formatNumber(capacity, locale),
        max: formatNumber(maxCapacity, locale),
      })}
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users aria-hidden className="size-3 shrink-0 text-muted-foreground" />
        <span className="text-[10px] font-medium">{t("capacity")}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={
            !isEditable || capacity <= minCapacity || updateMutation.isPending
          }
          onClick={() => handleDelta(-1)}
          aria-label={t("calendarView.decreaseCapacity")}
          className="size-5 rounded-md hover:bg-muted"
        >
          <Minus className="size-3 text-muted-foreground" aria-hidden />
        </Button>

        <span className="min-w-4 text-center text-xs font-bold text-foreground tabular-nums">
          {formatNumber(capacity, locale)}
        </span>

        {proposal.classroom?.capacity && (
          <span
            className="text-[10px] text-muted-foreground/70 tabular-nums"
            title={t("calendarView.maxCapacity", {
              max: formatNumber(maxCapacity, locale),
            })}
          >
            / {formatNumber(maxCapacity, locale)}
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={
            !isEditable || capacity >= maxCapacity || updateMutation.isPending
          }
          onClick={() => handleDelta(1)}
          aria-label={t("calendarView.increaseCapacity")}
          className="size-5 rounded-md hover:bg-muted"
        >
          <Plus className="size-3 text-muted-foreground" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
