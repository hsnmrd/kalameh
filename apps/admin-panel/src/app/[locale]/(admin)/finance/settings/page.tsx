"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { FinancialInfoBanner } from "./components/financial-info-banner"
import { FinancialSettingsForm } from "./components/financial-settings-form"

export default function FinancialSettingsPage() {
  const t = useTranslations("transactions.settings")
  const tCommon = useTranslations("common")
  const { activeInstituteId } = useActiveInstitute()

  const { data: institute, isLoading } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  return (
    <ModuleGuard module={APP_MODULES.FINANCE}>
      <PermissionGuard
        permission={PERMISSIONS.MANAGE_INSTITUTE_SETTINGS}
        mode="forbidden"
      >
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              items={[
                { label: tCommon("nav.finance"), href: "/transactions" },
                { label: t("title") },
              ]}
            />
          }
          className="flex flex-col gap-6"
        >
          <FinancialInfoBanner />

          {isLoading || !institute ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-12">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <FinancialSettingsForm institute={institute} />
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
