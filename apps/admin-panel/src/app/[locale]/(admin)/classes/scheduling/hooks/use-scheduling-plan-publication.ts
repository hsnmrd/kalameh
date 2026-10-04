"use client"

import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MicroApiError } from "micro-rq"
import {
  SchedulingPlanValidationSchema,
  type SchedulingPlanDetailsDto,
  type SchedulingPlanPublicationResult,
  type SchedulingPlanValidation,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

interface SchedulingPlanPublicationOptions {
  onPublished: (result: SchedulingPlanPublicationResult) => void
  onValidationBlocked: (validation: SchedulingPlanValidation) => void
}

export function useSchedulingPlanPublication(
  plan: SchedulingPlanDetailsDto,
  { onPublished, onValidationBlocked }: SchedulingPlanPublicationOptions
) {
  const t = useTranslations("scheduling.planPublication")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const mutation = useMutation({
    ...schedulingResource.publishPlan.toMutation(),
    onSuccess: async (result) => {
      queryClient.setQueriesData<SchedulingPlanDetailsDto>(
        { queryKey: schedulingResource.planDetail.baseKey() },
        (current) => {
          if (!current || current.runId !== result.runId) return current

          if (current.id === result.planId) {
            return {
              ...current,
              status: "PUBLISHED",
              publishedAt: result.publishedAt,
            }
          }

          if (!["DRAFT", "SELECTED"].includes(current.status)) return current
          return {
            ...current,
            status: "REJECTED",
            rejectedAt: result.publishedAt,
          }
        }
      )
      onPublished(result)
      toast.success(
        t("success", { count: formatNumber(result.proposalCount, locale) })
      )
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.baseKey(),
      })
    },
    onError: (error) => {
      if (!(error instanceof MicroApiError)) return
      const data = error.data as { validation?: unknown } | undefined
      const validation = SchedulingPlanValidationSchema.safeParse(
        data?.validation
      )
      if (validation.success) onValidationBlocked(validation.data)
    },
  })

  const publish = () => {
    mutation.mutate({
      planId: plan.id,
      instituteId: activeInstituteId,
    })
  }

  return { publish, isPending: mutation.isPending }
}
