"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Languages } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface ProfileLanguageCardProps {
  locale: string
  onSwitchLanguage: (newLocale: "en" | "fa") => void
}

export function ProfileLanguageCard({
  locale,
  onSwitchLanguage,
}: ProfileLanguageCardProps) {
  const t = useTranslations("profile")

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Languages className="size-4 text-slate-600" />
        <span>{t("languageSetting")}</span>
      </h3>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          type="button"
          variant={locale === "en" ? "default" : "outline"}
          onClick={() => onSwitchLanguage("en")}
          className={cn(
            "h-10 cursor-pointer rounded-xl text-xs font-semibold",
            locale === "en"
              ? "bg-slate-900 text-white shadow-xs"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          )}
        >
          <span>English (LTR)</span>
        </Button>
        <Button
          type="button"
          variant={locale === "fa" ? "default" : "outline"}
          onClick={() => onSwitchLanguage("fa")}
          className={cn(
            "h-10 cursor-pointer rounded-xl text-xs font-semibold",
            locale === "fa"
              ? "bg-slate-900 text-white shadow-xs"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          )}
        >
          <span>فارسی (RTL)</span>
        </Button>
      </div>
    </div>
  )
}
