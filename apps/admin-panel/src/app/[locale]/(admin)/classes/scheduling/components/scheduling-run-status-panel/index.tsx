"use client"

import { useTranslations } from "next-intl"
import { Ban, CheckCircle2, CircleAlert, RotateCcw } from "lucide-react"
import type { SchedulingRunDto, SchedulingRunStatus } from "@workspace/types"
import { Badge, type BadgeProps } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminFilterBar } from "@/components/admin-filter-bar"
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
  const statusQuery = useSchedulingRunStatus(run.id)
  const result = statusQuery.data
  const status = result?.status ?? run.status
  const isActive = ACTIVE_STATUSES.has(status)
  const isTerminal = result?.isTerminal ?? !isActive
  const isFailed = status === "FAILED" || status === "PREFLIGHT_FAILED"

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AdminFilterBar
        className="mb-0 lg:mb-0"
        search={
          <section
            aria-live="polite"
            aria-busy={isActive || statusQuery.isFetching}
            className="flex min-h-14 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2 sm:gap-4 sm:px-4"
          >
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                {isActive ? (
                  <Spinner className="size-4.5" />
                ) : status === "COMPLETED" ? (
                  <CheckCircle2 aria-hidden className="size-4.5 text-success" />
                ) : status === "CANCELLED" ? (
                  <Ban aria-hidden className="size-4.5" />
                ) : (
                  <CircleAlert
                    aria-hidden
                    className="size-4.5 text-destructive"
                  />
                )}
              </span>

              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="truncate text-xs font-bold text-foreground sm:text-sm">
                    {t(`statuses.${status}.title`)}
                  </h2>
                  <Badge
                    variant={statusVariants[status]}
                    className="h-5 shrink-0 px-2 text-[11px]"
                  >
                    {isActive && <Spinner data-icon="inline-start" size="sm" />}
                    {t(`statuses.${status}.badge`)}
                  </Badge>
                </div>
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {t(`statuses.${status}.description`)}
                </p>
              </div>
            </div>
          </section>
        }
        actions={
          isTerminal ? (
            <Button
              type="button"
              onClick={onReset}
              className="shrink-0 cursor-pointer gap-2 px-5 font-semibold shadow-xs"
            >
              <RotateCcw aria-hidden className="size-5" />
              <span>{t("another")}</span>
            </Button>
          ) : undefined
        }
      />

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
        <SchedulingPlanComparison planIds={result.result.planIds} />
      )}
    </div>
  )
}
