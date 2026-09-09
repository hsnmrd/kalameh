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
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useSchedulingPlanDetails } from "../../hooks/use-scheduling-plan-details"
import { SchedulingPlanCard } from "../scheduling-plan-card"
import { SchedulingPlanDetailsDialog } from "../scheduling-plan-details-dialog"

interface SchedulingPlanComparisonProps {
  planIds: string[]
  recommendedPlanId: string | null
}

export function SchedulingPlanComparison({
  planIds,
  recommendedPlanId,
}: SchedulingPlanComparisonProps) {
  const t = useTranslations("scheduling.comparison")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(
    null
  )
  const planQueries = useSchedulingPlanDetails(planIds)
  const isLoading = planQueries.some((query) => query.isPending)
  const isError = planQueries.some((query) => query.isError)
  const plans = planQueries
    .flatMap((query) => (query.data ? [query.data] : []))
    .sort((first, second) => first.rank - second.rank)
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)
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
    <section aria-labelledby="scheduling-comparison-title">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GitCompareArrows aria-hidden className="size-5" />
        </span>
        <div>
          <h2
            id="scheduling-comparison-title"
            className="text-lg font-bold text-foreground"
          >
            {t("title")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <SchedulingPlanCard
            key={plan.id}
            plan={plan}
            isRecommended={plan.id === recommendedPlanId || plan.isRecommended}
            isSelected={plan.status === "SELECTED"}
            isSelectionPending={selectionMutation.isPending}
            isSelecting={
              selectionMutation.isPending &&
              selectionMutation.variables?.planId === plan.id
            }
            onSelect={() => selectPlan(plan.id)}
            onViewDetails={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </div>

      {selectedPlan && (
        <SchedulingPlanDetailsDialog
          plan={selectedPlan}
          isRecommended={
            selectedPlan.id === recommendedPlanId || selectedPlan.isRecommended
          }
          isSelected={selectedPlan.status === "SELECTED"}
          isSelectionPending={selectionMutation.isPending}
          isSelecting={
            selectionMutation.isPending &&
            selectionMutation.variables?.planId === selectedPlan.id
          }
          onSelect={() => selectPlan(selectedPlan.id)}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
    </section>
  )
}
