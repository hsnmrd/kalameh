"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface CalendarToolbarProps {
  selectedYear: number
  currentYear: number
  onYearChange: (year: number) => void
  viewMode: "year" | "month"
  onViewModeChange: (mode: "year" | "month") => void
  locale: "fa" | "en"
}

export function CalendarToolbar({
  selectedYear,
  currentYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  locale,
}: CalendarToolbarProps) {
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

  const displayYear =
    locale === "fa"
      ? String(selectedYear).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d)
      : String(selectedYear)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
      {/* Year Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1">
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

          <span className="min-w-16 px-2 text-center text-sm font-bold text-foreground">
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
            className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("currentYear")}</span>
          </Button>
        )}
      </div>

      {/* Desktop View Switcher: Annual (12 months) vs Monthly */}
      <div className="hidden items-center rounded-xl border border-border bg-muted/40 p-1 lg:flex">
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
            viewMode === "month" && "bg-background text-foreground shadow-xs"
          )}
        >
          {t("monthView")}
        </Button>
      </div>
    </div>
  )
}
