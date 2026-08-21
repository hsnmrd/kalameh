"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { InstituteCard } from "./components/institute-card"

export default function InstitutesPage() {
  const t = useTranslations("institutes")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Button
          size="auth"
          className="h-11 cursor-pointer gap-2 rounded-xl px-5"
        >
          <Plus className="size-4" />
          <span>{t("addInstitute")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InstituteCard
          name="آموزشگاه مرکزی تهران"
          subdomain="tehran.kalameh.ir"
          isActive={true}
          classesCount={24}
        />
      </div>
    </div>
  )
}
