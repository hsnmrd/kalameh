"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { useSchedulingRunStore } from "@/lib/stores"
import { SchedulingRunStatusPanel } from "../../components/scheduling-run-status-panel"

export default function SchedulingRunResultPage() {
  const t = useTranslations("scheduling")
  const router = useRouter()
  const params = useParams()
  const runId = (params.runId as string) || ""
  const { activeRun, clearActiveRun } = useSchedulingRunStore()

  const run = activeRun?.id === runId ? activeRun : null

  const handleReset = React.useCallback(() => {
    clearActiveRun()
    router.push("/scheduling")
  }, [clearActiveRun, router])

  React.useEffect(() => {
    if (!run && runId) {
      router.push("/scheduling")
    }
  }, [run, runId, router])

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
          {run ? (
            <SchedulingRunStatusPanel run={run} onReset={handleReset} />
          ) : (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
