"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { AdminFilterBar } from "@/components/admin-filter-bar"

export interface CalendarFilterProps {
  selectedYear: number
  currentYear: number
  onYearChange: (year: number) => void
  viewMode: "year" | "month"
  onViewModeChange: (mode: "year" | "month") => void
  locale: "fa" | "en"
}

export type OffDaysFilterProps = CalendarFilterProps

function formatYear(year: number, locale: "fa" | "en"): string {
  if (locale === "fa") {
    return String(year).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d)
  }
  return String(year)
}

export function CalendarFilter({
  selectedYear,
  currentYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  locale,
}: CalendarFilterProps) {
  const t = useTranslations("setting.offDays")
  const isRtl = locale === "fa"

  const handlePrevYear = () => {
    onYearChange(selectedYear - 1)
  }

  const handleNextYear = () => {
    onYearChange(selectedYear + 1)
  }

  const handleResetToCurrentYear = () => {
    onYearChange(currentYear)
  }

  const displayYear = formatYear(selectedYear, locale)

  return (
    <AdminFilterBar
      search={
        <div className="flex h-14 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/60 px-3 sm:px-4">
          {/* Year Switcher without commas */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/70 p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handlePrevYear}
                aria-label={t("previousYear")}
                className="size-7 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
              >
                {isRtl ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronLeft className="size-4" />
                )}
              </Button>

              <span className="min-w-12 px-1 text-center text-xs font-bold text-foreground sm:text-sm">
                {displayYear}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleNextYear}
                aria-label={t("nextYear")}
                className="size-7 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground"
              >
                {isRtl ? (
                  <ChevronLeft className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            </div>

            {selectedYear !== currentYear && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToCurrentYear}
                className="hidden h-7 cursor-pointer gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <RotateCcw className="size-3" />
                <span>{t("currentYear")}</span>
              </Button>
            )}
          </div>

          {/* View Mode Tabs (Desktop) */}
          <div className="hidden items-center rounded-xl border border-border/80 bg-muted/40 p-1 lg:flex">
            <Button
              type="button"
              variant={viewMode === "year" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("year")}
              className={cn(
                "h-7 cursor-pointer rounded-lg px-3 text-xs font-medium transition-colors",
                viewMode === "year" && "bg-background text-foreground shadow-xs"
              )}
            >
              {t("yearView")}
            </Button>
            <Button
              type="button"
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("month")}
              className={cn(
                "h-7 cursor-pointer rounded-lg px-3 text-xs font-medium transition-colors",
                viewMode === "month" &&
                  "bg-background text-foreground shadow-xs"
              )}
            >
              {t("monthView")}
            </Button>
          </div>
        </div>
      }
    />
  )
}

export const OffDaysFilter = CalendarFilter
