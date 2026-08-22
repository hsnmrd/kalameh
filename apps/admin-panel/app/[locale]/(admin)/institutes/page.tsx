"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { institutesResource } from "@/lib/api"
import { InstituteCard } from "./components/institute-card"

export default function InstitutesPage() {
  const t = useTranslations("institutes")
  const { data: institutes = [], isLoading } = useQuery(
    institutesResource.list.toQuery()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          size="auth"
          className="h-11 cursor-pointer gap-2 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          <span>{t("addInstitute")}</span>
        </Button>
      </div>

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
    </div>
  )
}
