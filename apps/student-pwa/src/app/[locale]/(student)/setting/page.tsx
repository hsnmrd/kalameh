"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SettingThemeCard } from "./components/setting-theme-card"
import { SettingLanguageCard } from "./components/setting-language-card"

export default function StudentSettingPage() {
  const t = useTranslations("setting")

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">{t("title")}</h1>
      <SettingThemeCard />
      <SettingLanguageCard />
    </div>
  )
}
