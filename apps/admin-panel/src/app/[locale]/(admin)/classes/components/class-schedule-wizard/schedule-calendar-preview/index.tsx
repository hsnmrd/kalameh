"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar } from "@workspace/ui/components/calendar"
import { Badge } from "@workspace/ui/components/badge"
import type { TermDto, ClassConflictResult } from "@workspace/types"
import { toDateKey } from "../../../hooks/use-class-schedule-state"
import { ScheduleConflictBanner } from "../schedule-conflict-banner"

export interface ScheduleCalendarPreviewProps {
  term?: TermDto | null
  sessionDates: Date[]
  conflictingDates: string[]
  conflictResult: ClassConflictResult | null
  conflictMessage: string | null
  initialMonth: Date
  onDayClick: (date: Date) => void
  isDateDisabled: (date: Date) => boolean
}

export function ScheduleCalendarPreview({
  term,
  sessionDates,
  conflictingDates,
  conflictResult,
  conflictMessage,
  initialMonth,
  onDayClick,
  isDateDisabled,
}: ScheduleCalendarPreviewProps) {
  const t = useTranslations("classes.scheduleWizard")
  const locale = useLocale()

  const conflictingDateObjects = React.useMemo(() => {
    const dates: Date[] = []
    for (const key of conflictingDates) {
      const parts = key.split("-")
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      if (y && m && d) dates.push(new Date(y, m - 1, d))
    }
    return dates
  }, [conflictingDates])

  const normalSessionDates = React.useMemo(() => {
    if (conflictingDates.length === 0) return sessionDates
    const conflictSet = new Set(conflictingDates)
    return sessionDates.filter((d) => !conflictSet.has(toDateKey(d)))
  }, [sessionDates, conflictingDates])

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {t("calendarPreview")}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {conflictingDates.length > 0 && (
            <Badge
              variant="destructive"
              className="h-6 shrink-0 rounded-lg bg-warning px-2 text-xs font-medium whitespace-nowrap text-warning-foreground shadow-xs hover:bg-warning/90"
            >
              {t("conflictDaysCount", { count: conflictingDates.length })}
            </Badge>
          )}
          {term && sessionDates.length > 0 && (
            <Badge
              variant="secondary"
              className="h-6 shrink-0 rounded-lg px-2 text-xs font-medium whitespace-nowrap"
            >
              {t("calculatedSessions", { count: sessionDates.length })}
            </Badge>
          )}
        </div>
      </div>

      <ScheduleConflictBanner
        conflictResult={conflictResult}
        conflictMessage={conflictMessage}
      />

      {!term ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("noTermSelectedHint")}
        </p>
      ) : (
        <div className="space-y-2">
          <Calendar
            mode="single"
            defaultMonth={initialMonth}
            onDayClick={onDayClick}
            disabled={isDateDisabled}
            modifiers={{
              session: normalSessionDates,
              conflict: conflictingDateObjects,
            }}
            modifiersClassNames={{
              session:
                "!bg-primary !text-primary-foreground rounded-xl font-semibold shadow-xs hover:!bg-primary/90",
              conflict:
                "!bg-warning hover:!bg-warning/90 !text-warning-foreground rounded-xl font-semibold shadow-xs",
            }}
            locale={locale === "fa" ? "fa" : "en"}
            className="rounded-xl border border-border bg-card shadow-2xs"
          />
          <p className="text-center text-[11px] text-muted-foreground">
            {t("clickToToggleHint")}
          </p>
        </div>
      )}
    </div>
  )
}
