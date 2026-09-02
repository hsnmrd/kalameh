"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { CalendarClock, Clock, CalendarCheck } from "lucide-react"
import { cn, formatDate } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

export interface ScheduleDetailsPreviewProps {
  daysOfWeek?: string[] | null
  sessionDates?: string[] | null
  startTime?: string | null
  endTime?: string | null
  schedule?: string | null
  className?: string
}

export function ScheduleDetailsPreview({
  daysOfWeek,
  sessionDates,
  startTime,
  endTime,
  schedule,
  className,
}: ScheduleDetailsPreviewProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  const hasDays = Boolean(daysOfWeek && daysOfWeek.length > 0)
  const hasSessions = Boolean(sessionDates && sessionDates.length > 0)
  const hasTime = Boolean(startTime && endTime)
  const hasAnyScheduleInfo = Boolean(
    schedule || hasDays || hasSessions || hasTime
  )

  if (!hasAnyScheduleInfo) {
    return null
  }

  const sortedSessionDates = hasSessions ? [...(sessionDates || [])].sort() : []
  const firstSessionDate = sortedSessionDates[0]
  const lastSessionDate = sortedSessionDates[sortedSessionDates.length - 1]

  return (
    <div
      className={cn(
        "flex animate-in flex-col gap-2.5 rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs transition-all fade-in-50",
        className
      )}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CalendarClock className="size-4 shrink-0 text-foreground" />
          <span>{t("scheduleDetails.title")}</span>
        </div>

        {hasSessions && (
          <Badge
            variant="secondary"
            className="h-5 gap-1 px-2 text-[11px] font-medium"
          >
            <CalendarCheck className="size-3 text-muted-foreground" />
            <span>
              {t("scheduleDetails.sessionCount", {
                count: sortedSessionDates.length,
              })}
            </span>
          </Badge>
        )}
      </div>

      {/* Weekday Chips */}
      {hasDays && (
        <div className="flex flex-wrap items-center gap-1.5">
          {daysOfWeek?.map((day) => {
            const upperDay = day.toUpperCase()
            let dayLabel = day
            try {
              dayLabel = t(`scheduleWizard.days.${upperDay}` as any)
            } catch {
              dayLabel = day
            }

            return (
              <Badge
                key={day}
                variant="outline"
                className="h-6 rounded-lg border-border/70 bg-background px-2 text-xs font-normal text-foreground"
              >
                {dayLabel}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Time & Session Dates Range */}
      {(hasTime || (firstSessionDate && lastSessionDate)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          {hasTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <span>
                {t("scheduleDetails.timeSlot", {
                  start: startTime ?? "",
                  end: endTime ?? "",
                })}
              </span>
            </div>
          )}

          {firstSessionDate && lastSessionDate && (
            <div className="flex items-center gap-1">
              <span>
                {t("scheduleDetails.dateRange", {
                  start: formatDate(firstSessionDate, locale),
                  end: formatDate(lastSessionDate, locale),
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
