"use client"

import { useTranslations } from "next-intl"
import { GitCompareArrows, RefreshCw } from "lucide-react"
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
import { useSchedulingPlanDetails } from "../../hooks/use-scheduling-plan-details"
import { SchedulingPlanCard } from "../scheduling-plan-card"

interface SchedulingPlanComparisonProps {
  planIds: string[]
  recommendedPlanId: string | null
}

export function SchedulingPlanComparison({
  planIds,
  recommendedPlanId,
}: SchedulingPlanComparisonProps) {
  const t = useTranslations("scheduling.comparison")
  const planQueries = useSchedulingPlanDetails(planIds)
  const isLoading = planQueries.some((query) => query.isPending)
  const isError = planQueries.some((query) => query.isError)
  const plans = planQueries
    .flatMap((query) => (query.data ? [query.data] : []))
    .sort((first, second) => first.rank - second.rank)

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
          />
        ))}
      </div>
    </section>
  )
}
