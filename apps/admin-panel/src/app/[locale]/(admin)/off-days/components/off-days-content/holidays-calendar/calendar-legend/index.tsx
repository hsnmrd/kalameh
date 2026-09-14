"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

export function CalendarLegend() {
  const t = useTranslations("setting.offDays")

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-destructive" />
        <span>{t("legendOfficialHoliday")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-success" />
        <span>{t("legendDismissedHoliday")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-warning" />
        <span>{t("legendCustomOff")}</span>
      </div>
    </div>
  )
}
