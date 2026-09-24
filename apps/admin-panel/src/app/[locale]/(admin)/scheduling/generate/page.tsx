"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  APP_MODULES,
  PERMISSIONS,
  type SchedulingRunDto,
} from "@workspace/types"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { SchedulingGenerationForm } from "../components/scheduling-generation-form"
import { SchedulingRunStatusPanel } from "../components/scheduling-run-status-panel"

export default function SchedulingGeneratePage() {
  const t = useTranslations("scheduling")
  const router = useRouter()

  const [createdRun, setCreatedRun] = React.useState<SchedulingRunDto | null>(
    null
  )

  const backHref = "/scheduling"

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref={backHref}
              backLabel={t("title")}
              items={[
                { label: t("title"), href: "/scheduling" },
                { label: t("generation.title") },
              ]}
            />
          }
        >
          {createdRun ? (
            <SchedulingRunStatusPanel
              run={createdRun}
              onReset={() => setCreatedRun(null)}
            />
          ) : (
            <SchedulingGenerationForm
              onCreated={(run) => setCreatedRun(run)}
              onNavigateToDemand={() => router.push(backHref)}
            />
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
