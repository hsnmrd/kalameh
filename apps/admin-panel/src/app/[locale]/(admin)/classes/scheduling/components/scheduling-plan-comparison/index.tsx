"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GitCompareArrows, RefreshCw } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { useRouter } from "@/i18n/routing"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useSchedulingPlanDetails } from "../../hooks/use-scheduling-plan-details"
import { SchedulingPlanCard } from "../scheduling-plan-card"
import { SchedulingPlanTable } from "../scheduling-plan-table"

interface SchedulingPlanComparisonProps {
  planIds: string[]
  onViewDetails?: (planId: string) => void
}

export function SchedulingPlanComparison({
  planIds,
  onViewDetails,
}: SchedulingPlanComparisonProps) {
  const t = useTranslations("scheduling.comparison")
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const planQueries = useSchedulingPlanDetails(planIds)
  const isLoading = planQueries.some((query) => query.isPending)
  const isError = planQueries.some((query) => query.isError)
  const plans = planQueries
    .flatMap((query) => (query.data ? [query.data] : []))
    .sort((first, second) => first.rank - second.rank)

  const handleViewDetails = React.useCallback(
    (planId: string) => {
      if (onViewDetails) {
        onViewDetails(planId)
      } else {
        router.push(`/classes/scheduling/plans/${planId}`)
      }
    },
    [onViewDetails, router]
  )
  const selectionMutation = useMutation({
    ...schedulingResource.selectPlan.toMutation(),
    onSuccess: (result) => {
      queryClient.setQueriesData<SchedulingPlanDetailsDto>(
        { queryKey: schedulingResource.planDetail.baseKey() },
        (current) => {
          if (!current || current.runId !== result.runId) return current
          const isSelected = current.id === result.planId
          return {
            ...current,
            status: isSelected ? "SELECTED" : "DRAFT",
            selectedAt: isSelected ? result.selectedAt : null,
            firstReviewStartedAt:
              isSelected && !current.firstReviewStartedAt
                ? result.selectedAt
                : current.firstReviewStartedAt,
          }
        }
      )
      toast.success(t("selection.success"))
    },
  })

  const selectPlan = (planId: string) => {
    selectionMutation.mutate({ planId, instituteId: activeInstituteId })
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <Empty variant="compact" aria-live="polite">
          <EmptyMedia>
            <Spinner size="lg" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("loading.title")}</EmptyTitle>
            <EmptyDescription>{t("loading.description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    )
  }

  if (isError || plans.length !== planIds.length) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <Empty variant="compact" aria-live="polite">
          <EmptyMedia variant="destructive">
            <GitCompareArrows aria-hidden />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("error.title")}</EmptyTitle>
            <EmptyDescription>{t("error.description")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => planQueries.forEach((query) => query.refetch())}
            >
              <RefreshCw aria-hidden data-icon="inline-start" />
              {t("error.retry")}
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    )
  }

  return (
    <section aria-label={t("title")}>
      <div className="hidden lg:block">
        <SchedulingPlanTable
          plans={plans}
          isSelectionPending={selectionMutation.isPending}
          selectingPlanId={selectionMutation.variables?.planId}
          onSelect={selectPlan}
          onViewDetails={handleViewDetails}
        />
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:hidden">
        {plans.map((plan) => {
          const isSelecting =
            selectionMutation.isPending &&
            selectionMutation.variables?.planId === plan.id

          return (
            <SchedulingPlanCard
              key={plan.id}
              plan={plan}
              isSelected={plan.status === "SELECTED"}
              isSelectionPending={selectionMutation.isPending}
              isSelecting={isSelecting}
              onSelect={() => selectPlan(plan.id)}
              onViewDetails={() => handleViewDetails(plan.id)}
            />
          )
        })}
      </div>
    </section>
  )
}
