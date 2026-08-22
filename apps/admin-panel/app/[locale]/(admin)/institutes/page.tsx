"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Building2 } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { institutesResource } from "@/lib/api"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminPageHeader } from "@/components/admin-page-header"
import { InstituteCard } from "./components/institute-card"

export default function InstitutesPage() {
  const t = useTranslations("institutes")
  const { data: institutes = [], isLoading } = useQuery(
    institutesResource.list.toQuery()
  )

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          count={institutes.length}
          countIcon={Building2}
          action={{
            label: t("addInstitute"),
            onClick: () => {},
          }}
        />
      }
    >
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : institutes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("noInstitutes")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {institutes.map((institute) => (
            <InstituteCard key={institute.id} institute={institute} />
          ))}
        </div>
      )}
    </AdminPageShell>
  )
}
