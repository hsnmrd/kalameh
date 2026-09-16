"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

export interface CalendarLegendProps {
  accentColor?: string
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  hasCustomOffDays?: boolean
  hasCompensatorySessions?: boolean
  hasDismissedHolidays?: boolean
}

export function CalendarLegend({
  accentColor = "#2563eb",
  locale = "fa",
  observeOfficialHolidays = true,
  hasCustomOffDays = false,
  hasCompensatorySessions = false,
  hasDismissedHolidays = false,
}: CalendarLegendProps) {
  const t = useTranslations("terms")

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-muted/25 px-4 py-2 text-xs text-muted-foreground">
      {/* Scheduled Term Days */}
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-md text-[11px] font-medium"
          style={{
            backgroundColor: `${accentColor}35`,
            color: accentColor,
          }}
        >
          {locale === "fa" ? "۱۵" : "15"}
        </span>
        <span>{t("batchModal.legendClassDays")}</span>
      </div>

      {/* Weekend (Fridays) */}
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-destructive/15 text-[11px] font-bold text-destructive">
          {locale === "fa" ? "۱۶" : "16"}
        </span>
        <span>{t("batchModal.legendFridays")}</span>
      </div>

      {/* Official Iranian Holidays */}
      {observeOfficialHolidays && (
        <div className="flex items-center gap-2">
          <span className="relative flex size-6 items-center justify-center rounded-md bg-destructive/15 text-[11px] font-bold text-destructive after:absolute after:bottom-0.5 after:size-1 after:rounded-full after:bg-destructive">
            {locale === "fa" ? "۱۷" : "17"}
          </span>
          <span>{t("batchModal.legendOfficialHolidays")}</span>
        </div>
      )}

      {/* Custom Institute Off-Days */}
      {hasCustomOffDays && (
        <div className="flex items-center gap-2">
          <span className="relative flex size-6 items-center justify-center rounded-md bg-warning/15 text-[11px] font-bold text-warning after:absolute after:bottom-0.5 after:size-1 after:rounded-full after:bg-warning">
            {locale === "fa" ? "۱۸" : "18"}
          </span>
          <span>{t("batchModal.legendCustomOffDays")}</span>
        </div>
      )}

      {/* Dismissed Holidays */}
      {hasDismissedHolidays && (
        <div className="flex items-center gap-2">
          <span className="relative flex size-6 items-center justify-center rounded-md bg-emerald-500/15 text-[11px] font-bold text-emerald-700 after:absolute after:bottom-0.5 after:size-1 after:rounded-full after:bg-emerald-600">
            {locale === "fa" ? "۱۹" : "19"}
          </span>
          <span>{t("batchModal.statusDismissedHoliday")}</span>
        </div>
      )}

      {/* Compensatory Sessions */}
      {hasCompensatorySessions && (
        <div className="flex items-center gap-2">
          <span className="relative flex size-6 items-center justify-center rounded-md border-2 border-primary text-[11px] font-bold text-primary after:absolute after:bottom-0.5 after:size-1 after:rounded-full after:bg-primary">
            {locale === "fa" ? "۲۰" : "20"}
          </span>
          <span>{t("batchModal.compensatoryModalTitle")}</span>
        </div>
      )}
    </div>
  )
}
