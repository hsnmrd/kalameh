"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AdminPageShell } from "@/components/admin-page-shell"
import { SettingThemeCard } from "./components/setting-theme-card"
import { SettingLanguageCard } from "./components/setting-language-card"
import { SettingOffDaysCard } from "./components/setting-off-days-card"

export default function SettingPage() {
  const t = useTranslations("setting")

  return (
    <AdminPageShell className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-6">
        <SettingThemeCard />
        <SettingLanguageCard />
        <SettingOffDaysCard />
      </div>
    </AdminPageShell>
  )
}
