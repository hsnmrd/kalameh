"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SettingThemeCard } from "./components/setting-theme-card"
import { SettingLanguageCard } from "./components/setting-language-card"

export default function StudentSettingPage() {
  const t = useTranslations("setting")

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        <SettingThemeCard />
        <SettingLanguageCard />
      </div>
    </div>
  )
}
