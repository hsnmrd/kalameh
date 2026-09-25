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
  const router = useRouter()
  const params = useParams()
  const runId = (params.runId as string) || ""
  const { activeRun, clearActiveRun } = useSchedulingRunStore()

  const statusQuery = useSchedulingRunStatus(runId)

  const handleReset = React.useCallback(() => {
    clearActiveRun()
    router.push("/scheduling")
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

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/scheduling"
              backLabel={t("title")}
              items={[
                { label: t("title"), href: "/scheduling" },
                { label: t("runStatus.pageTitle") },
              ]}
            />
          }
        >
          {resolvedRun ? (
            <SchedulingRunStatusPanel run={resolvedRun} onReset={handleReset} />
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
                  onClick={() => router.push("/scheduling")}
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
