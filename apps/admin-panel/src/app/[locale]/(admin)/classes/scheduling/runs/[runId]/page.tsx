"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowRight, RotateCcw } from "lucide-react"
import {
  APP_MODULES,
  PERMISSIONS,
  type SchedulingRunDto,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { FABSingle } from "@workspace/ui/components/fab"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { useSchedulingRunStore } from "@/lib/stores"
import { useSchedulingRunStatus } from "../../hooks/use-scheduling-run-status"
import { SchedulingRunStatusPanel } from "../../components/scheduling-run-status-panel"

export default function SchedulingRunResultPage() {
  const t = useTranslations("scheduling")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const params = useParams()
  const runId = (params.runId as string) || ""
  const { activeRun, clearActiveRun } = useSchedulingRunStore()

  const statusQuery = useSchedulingRunStatus(runId)

  const handleReset = React.useCallback(() => {
    clearActiveRun()
    router.push("/classes/scheduling")
  }, [clearActiveRun, router])

  const resolvedRun = React.useMemo(() => {
    if (activeRun?.id === runId) {
      return activeRun
    }
    if (statusQuery.data) {
      return {
        id: runId,
        status: statusQuery.data.status,
        updatedAt: statusQuery.data.updatedAt,
        createdAt: statusQuery.data.createdAt,
        startedAt: statusQuery.data.startedAt,
        completedAt: statusQuery.data.completedAt,
        preflightReport: statusQuery.data.preflightReport,
        failureCode: statusQuery.data.failureCode,
        failureMessage: statusQuery.data.failureMessage,
        inputSnapshot: {},
        settingsSnapshot: {},
        plans: [],
      } as unknown as SchedulingRunDto
    }
    return null
  }, [activeRun, runId, statusQuery.data])

  const isTerminal = React.useMemo(() => {
    if (!resolvedRun) return false
    const status = statusQuery.data?.status ?? resolvedRun.status
    return (
      statusQuery.data?.isTerminal ??
      (status !== "QUEUED" && status !== "GENERATING")
    )
  }, [resolvedRun, statusQuery.data])

  const completedPlanId = React.useMemo(() => {
    const status = statusQuery.data?.status ?? resolvedRun?.status
    if (status !== "COMPLETED") return null
    return (
      statusQuery.data?.result?.recommendedPlanId ??
      statusQuery.data?.result?.planIds?.[0] ??
      resolvedRun?.plans?.[0]?.id ??
      null
    )
  }, [statusQuery.data, resolvedRun])

  React.useEffect(() => {
    if (completedPlanId) {
      router.replace(`/classes/scheduling/plans/${completedPlanId}`)
    }
  }, [completedPlanId, router])

  const isCompleted = React.useMemo(() => {
    const status = statusQuery.data?.status ?? resolvedRun?.status
    return status === "COMPLETED"
  }, [resolvedRun, statusQuery.data])

  const isFailed = React.useMemo(() => {
    if (!resolvedRun) return false
    const status = statusQuery.data?.status ?? resolvedRun.status
    return status === "FAILED" || status === "PREFLIGHT_FAILED"
  }, [resolvedRun, statusQuery.data])

  const handleRetry = React.useCallback(() => {
    clearActiveRun()
    if (resolvedRun?.termId) {
      router.push(`/classes/scheduling/generate?termId=${resolvedRun.termId}`)
    } else {
      router.push("/classes/scheduling")
    }
  }, [clearActiveRun, resolvedRun?.termId, router])

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/classes/scheduling"
              backLabel={t("title")}
              items={[
                { label: tCommon("nav.classes"), href: "/classes" },
                { label: t("title"), href: "/classes/scheduling" },
                { label: t("runStatus.pageTitle") },
              ]}
            />
          }
          fab={
            isTerminal && !isCompleted ? (
              <FABSingle
                onClick={isFailed ? handleRetry : handleReset}
                aria-label={
                  isFailed ? t("runStatus.retry") : t("runStatus.another")
                }
              >
                <RotateCcw className="size-6" aria-hidden />
              </FABSingle>
            ) : undefined
          }
        >
          {isCompleted || completedPlanId ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : resolvedRun ? (
            <SchedulingRunStatusPanel
              run={resolvedRun}
              onReset={handleReset}
              onRetry={handleRetry}
            />
          ) : statusQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-lg font-bold text-foreground">
                {t("runStatus.notFound.title")}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {statusQuery.error instanceof Error
                  ? statusQuery.error.message
                  : t("runStatus.notFound.description")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => statusQuery.refetch()}
                  disabled={statusQuery.isFetching}
                >
                  {statusQuery.isFetching ? (
                    <Spinner data-icon="inline-start" size="sm" />
                  ) : (
                    <RotateCcw data-icon="inline-start" className="size-4" />
                  )}
                  {t("runStatus.retry")}
                </Button>
                <Button
                  type="button"
                  size="default"
                  onClick={() => router.push("/classes/scheduling")}
                >
                  <ArrowRight data-icon="inline-start" className="size-4" />
                  {t("runStatus.notFound.back")}
                </Button>
              </div>
            </div>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
