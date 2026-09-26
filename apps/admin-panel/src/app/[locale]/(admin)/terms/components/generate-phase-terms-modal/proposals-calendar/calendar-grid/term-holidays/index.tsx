"use client"

import { useTranslations } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"

interface HolidayItem {
  dateYmd: string
  dateJalali: string
  title: string
  isDismissed: boolean
}

export function TermHolidays({
  holidays,
  locale,
}: {
  holidays: HolidayItem[]
  locale: "fa" | "en"
}) {
  const t = useTranslations("terms")
  if (holidays.length === 0) return null

  return (
    <div
      dir={locale === "fa" ? "rtl" : "ltr"}
      className="flex w-full flex-wrap items-center justify-start gap-x-4 gap-y-1.5 px-1 text-start text-xs text-muted-foreground"
    >
      {holidays.map((holiday) => (
        <span
          key={holiday.dateYmd}
          className="inline-flex items-center gap-1.5"
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              holiday.isDismissed ? "bg-emerald-600" : "bg-destructive"
            )}
          />
          <span className="font-medium text-foreground">
            {holiday.dateJalali}
          </span>
          <span>:</span>
          <span>{holiday.title}</span>
          {holiday.isDismissed && (
            <span className="text-[11px] font-medium text-emerald-600">
              ({t("batchModal.statusDismissedBadge")})
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
