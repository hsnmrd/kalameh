"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarOff, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/routing"
import { AdminFilterBar } from "@/components/admin-filter-bar"

export interface OffDaysFilterProps {
  selectedYear: number
  currentYear: number
  onYearChange: (year: number) => void
  viewMode: "year" | "month"
  onViewModeChange: (mode: "year" | "month") => void
  locale: "fa" | "en"
}

function formatYear(year: number, locale: "fa" | "en"): string {
  if (locale === "fa") {
    return String(year).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d)
  }
  return String(year)
}

export function OffDaysFilter({
  selectedYear,
  currentYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  locale,
}: OffDaysFilterProps) {
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

  const desktopActions = (
    <Button
      render={<Link href="/off-days/custom" />}
      nativeButton={false}
      className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
    >
      <CalendarOff className="size-5" />
      <span>{t("manageCustomOffDays")}</span>
    </Button>
  )

  return (
    <AdminFilterBar
      actions={desktopActions}
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
