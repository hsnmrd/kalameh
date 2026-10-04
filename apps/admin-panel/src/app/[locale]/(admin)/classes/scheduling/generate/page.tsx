"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
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
import { useSchedulingRunStore } from "@/lib/stores"
import { SchedulingGenerationForm } from "../components/scheduling-generation-form"

export default function SchedulingGeneratePage() {
  const t = useTranslations("scheduling")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTermId = searchParams.get("termId") ?? undefined
  const defaultBranchId = searchParams.get("branchId") ?? undefined
  const { setActiveRun } = useSchedulingRunStore()

  const handleCreated = React.useCallback(
    (run: SchedulingRunDto) => {
      setActiveRun(run)
      router.push(`/classes/scheduling/runs/${run.id}`)
    },
    [setActiveRun, router]
  )

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
                { label: t("generation.title") },
              ]}
            />
          }
        >
          <SchedulingGenerationForm
            defaultTermId={defaultTermId}
            defaultBranchId={defaultBranchId}
            onCreated={handleCreated}
            onNavigateToDemand={() => router.push("/classes/scheduling")}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
