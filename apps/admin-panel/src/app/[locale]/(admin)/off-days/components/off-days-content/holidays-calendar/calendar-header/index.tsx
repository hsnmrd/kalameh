"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarDays } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface CalendarHeaderProps {
  termsCount?: number
  locale?: "fa" | "en"
}

export function CalendarHeader({
  termsCount = 0,
  locale = "fa",
}: CalendarHeaderProps) {
  const t = useTranslations("setting.offDays")

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {t("calendarTitle")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("calendarDescription")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {termsCount > 0 && (
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-xs font-medium text-primary"
          >
            {locale === "fa"
              ? `${formatNumber(termsCount, "fa-IR")} ترم تعریف‌شده`
              : t("termsInMonth", { count: termsCount })}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="border-border bg-muted/30 text-xs font-medium text-muted-foreground"
        >
          {t("viewOnlyBadge")}
        </Badge>
      </div>
    </div>
  )
}
