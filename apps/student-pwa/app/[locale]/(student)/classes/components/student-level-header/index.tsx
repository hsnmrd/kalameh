"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Award } from "lucide-react"

export interface StudentLevelHeaderProps {
  allowedCourseTitle?: string
}

export function StudentLevelHeader({
  allowedCourseTitle,
}: StudentLevelHeaderProps) {
  const t = useTranslations("classes")

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-2xs">
          <Award className="size-5" />
        </div>
        <div className="flex-1">
          <span className="block text-xs font-semibold text-foreground">
            {allowedCourseTitle
              ? t("allowedLevel", { level: allowedCourseTitle })
              : t("noLevelAssigned")}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            فقط کلاس‌های متناسب با این سطح برای شما نمایش داده می‌شوند.
          </span>
        </div>
      </div>
    </div>
  )
}
