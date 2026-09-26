"use client"

import { useLocale, useTranslations } from "next-intl"
import { Ban, CheckCircle2, CircleAlert, RotateCcw } from "lucide-react"
import type { SchedulingRunDto, SchedulingRunStatus } from "@workspace/types"
import { Badge, type BadgeProps } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { useSchedulingRunStatus } from "../../hooks/use-scheduling-run-status"
import { SchedulingPlanComparison } from "../scheduling-plan-comparison"
import { SchedulingRunProgress } from "../scheduling-run-progress"
import { ConnectionError } from "./connection-error"
import { FailureDetails } from "./failure-details"

interface SchedulingRunStatusPanelProps {
  run: SchedulingRunDto
  onReset: () => void
}

const ACTIVE_STATUSES = new Set<SchedulingRunStatus>(["QUEUED", "GENERATING"])

const statusVariants: Record<
  SchedulingRunStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  QUEUED: "secondary",
  GENERATING: "info",
  COMPLETED: "success",
  PREFLIGHT_FAILED: "warning",
  FAILED: "destructive",
  CANCELLED: "outline",
}

export function SchedulingRunStatusPanel({
  run,
  onReset,
}: SchedulingRunStatusPanelProps) {
  const t = useTranslations("scheduling.runStatus")
  const locale = useLocale()
  const statusQuery = useSchedulingRunStatus(run.id)
  const result = statusQuery.data
  const status = result?.status ?? run.status
  const isActive = ACTIVE_STATUSES.has(status)
  const isTerminal = result?.isTerminal ?? !isActive
  const isFailed = status === "FAILED" || status === "PREFLIGHT_FAILED"
  const updatedAt = result?.updatedAt ?? run.updatedAt

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section
        aria-live="polite"
        aria-busy={isActive || statusQuery.isFetching}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-6 sm:py-8">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              {isActive ? (
                <Spinner size="lg" />
              ) : status === "COMPLETED" ? (
                <CheckCircle2 aria-hidden className="size-6 text-success" />
              ) : status === "CANCELLED" ? (
                <Ban aria-hidden className="size-6" />
              ) : (
                <CircleAlert aria-hidden className="size-6 text-destructive" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {t(`statuses.${status}.title`)}
                </h2>
                <Badge variant={statusVariants[status]}>
                  {isActive && <Spinner data-icon="inline-start" size="sm" />}
                  {t(`statuses.${status}.badge`)}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t(`statuses.${status}.description`)}
              </p>
            </div>
          </div>

          {isActive && (
            <SchedulingRunProgress status={status} isFailed={isFailed} />
          )}

          {statusQuery.isError && (
            <ConnectionError
              error={statusQuery.error}
              isFetching={statusQuery.isFetching}
              onRetry={() => statusQuery.refetch()}
            />
          )}

          {isFailed && <FailureDetails run={run} result={result} />}

          {status === "COMPLETED" && result?.result && (
            <div className="rounded-xl bg-success/10 p-4">
              <p className="font-semibold text-foreground">
                {t("result.title", {
                  count: formatNumber(result.result.planIds.length, locale),
                })}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {result.result.recommendedPlanId
                  ? t("result.recommended")
                  : t("result.noRecommendation")}
              </p>
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-xs leading-5 text-muted-foreground">
              <p className="break-all">{t("runId", { id: run.id })}</p>
              <p>
                {t("updatedAt", {
                  value: new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(updatedAt)),
                })}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {isTerminal && (
                <Button type="button" size="lg" onClick={onReset}>
                  <RotateCcw aria-hidden data-icon="inline-start" />
                  {t("another")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {status === "COMPLETED" && result?.result && (
        <SchedulingPlanComparison
          planIds={result.result.planIds}
          recommendedPlanId={result.result.recommendedPlanId}
        />
      )}
    </div>
  )
}
