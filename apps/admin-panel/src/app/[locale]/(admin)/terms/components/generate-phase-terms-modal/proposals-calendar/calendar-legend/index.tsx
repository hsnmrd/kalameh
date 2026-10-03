"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

export interface CalendarLegendProps {
  accentColor?: string
  evenColorHex?: string
  oddColorHex?: string
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  hasCustomOffDays?: boolean
  hasCompensatorySessions?: boolean
  hasDismissedHolidays?: boolean
  hasExcessSessions?: boolean
}

export function CalendarLegend({
  accentColor = "#2563eb",
  evenColorHex,
  oddColorHex,
  locale = "fa",
  observeOfficialHolidays = true,
  hasCustomOffDays = false,
  hasCompensatorySessions = false,
  hasDismissedHolidays = false,
  hasExcessSessions = false,
}: CalendarLegendProps) {
  const t = useTranslations("terms")

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-border/60 bg-muted/25 px-4 py-2.5 text-xs text-muted-foreground">
      {/* Even Sessions */}
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-md text-[11px] font-bold"
          style={{
            backgroundColor: evenColorHex || `${accentColor}40`,
            color: accentColor,
          }}
        >
          {locale === "fa" ? "۱۴" : "14"}
        </span>
        <span>{t("batchModal.legendEvenSessions")}</span>
      </div>

      {/* Odd Sessions */}
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-md text-[11px] font-medium"
          style={{
            backgroundColor: oddColorHex || `${accentColor}18`,
            color: accentColor,
          }}
        >
          {locale === "fa" ? "۱۵" : "15"}
        </span>
        <span>{t("batchModal.legendOddSessions")}</span>
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
          <span>{t("batchModal.legendDismissedHolidays")}</span>
        </div>
      )}

      {/* Compensatory Sessions */}
      {hasCompensatorySessions && (
        <div className="flex items-center gap-2">
          <span className="relative flex size-6 items-center justify-center rounded-md border-2 border-primary text-[11px] font-bold text-primary after:absolute after:bottom-0.5 after:size-1 after:rounded-full after:bg-primary">
            {locale === "fa" ? "۲۰" : "20"}
          </span>
          <span>{t("batchModal.legendCompensatorySession")}</span>
        </div>
      )}

      {/* Excess Sessions */}
      {hasExcessSessions && (
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md border-2 border-dashed border-warning text-[11px] font-bold text-warning">
            {locale === "fa" ? "۲۱" : "21"}
          </span>
          <span>{t("batchModal.legendExcessSession")}</span>
        </div>
      )}

      {/* Final Exam Sessions */}
      <div className="flex items-center gap-2">
        <span className="relative flex size-6 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-[11px] font-bold text-foreground before:absolute before:bottom-0.5 before:left-1/2 before:-translate-x-1/2 before:text-[9px] before:leading-none before:text-current before:content-['★']">
          {locale === "fa" ? "۲۲" : "22"}
        </span>
        <span>{t("batchModal.legendExamSession")}</span>
      </div>
    </div>
  )
}
