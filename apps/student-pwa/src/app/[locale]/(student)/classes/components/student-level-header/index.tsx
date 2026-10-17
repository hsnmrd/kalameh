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
    <div className="flex items-center gap-3 border-b border-border/60 pb-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Award className="size-4" />
      </div>
      <div className="flex-1">
        <span className="block text-xs font-bold text-foreground">
          {allowedCourseTitle
            ? t("allowedLevel", { level: allowedCourseTitle })
            : t("noLevelAssigned")}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          فقط کلاس‌های متناسب با این سطح برای شما نمایش داده می‌شوند.
        </span>
      </div>
    </div>
  )
}
