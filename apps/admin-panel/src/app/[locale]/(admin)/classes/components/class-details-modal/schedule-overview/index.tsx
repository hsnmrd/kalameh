"use client"

import { useTranslations } from "next-intl"
import { CalendarCheck, CalendarClock, CalendarDays, Clock } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { formatDate, formatNumber } from "@workspace/ui/lib/utils"
import type { ClassDto } from "@workspace/types"

interface ScheduleOverviewProps {
  cls: ClassDto
  locale: string
  sortedDates: string[]
  showAllDates: boolean
  onToggleDates: () => void
}

export function ScheduleOverview({
  cls,
  locale,
  sortedDates,
  showAllDates,
  onToggleDates,
}: ScheduleOverviewProps) {
  const t = useTranslations("classes")
  const firstDate = sortedDates[0]
  const lastDate = sortedDates.at(-1)
  const hasDates = sortedDates.length > 0

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {t("detailsModal.schedule")}
          </span>
        </div>
        {hasDates && (
          <Badge
            variant="secondary"
            className="h-5 gap-1 px-2 text-[11px] font-medium"
          >
            <CalendarCheck className="size-3 text-muted-foreground" />
            <span>
              {t("scheduleDetails.sessionCount", { count: sortedDates.length })}
            </span>
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-3 pt-3">
        {cls.daysOfWeek && cls.daysOfWeek.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {cls.daysOfWeek.map((day) => {
              const upperDay = day.toUpperCase()
              let label = day
              try {
                label = t(`scheduleWizard.days.${upperDay}` as never) || day
              } catch {
                label = day
              }
              return (
                <Badge
                  key={day}
                  variant="outline"
                  className="h-6 rounded-lg border-border/70 bg-background px-2.5 text-xs font-normal text-foreground"
                >
                  {label}
                </Badge>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {cls.schedule || t("detailsModal.noSchedule")}
          </p>
        )}
        {cls.startTime && cls.endTime && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {t("scheduleDetails.timeSlot", {
                start: cls.startTime,
                end: cls.endTime,
              })}
            </span>
          </div>
        )}
        {firstDate && lastDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {t("scheduleDetails.dateRange", {
                start: formatDate(firstDate, locale),
                end: formatDate(lastDate, locale),
              })}
            </span>
          </div>
        )}
        {hasDates && (
          <div className="border-t border-border/40 pt-2.5">
            <Button
              type="button"
              variant="link"
              onClick={onToggleDates}
              className="h-auto w-full justify-between p-0 text-[11px] font-medium text-primary"
            >
              <span>
                {t("detailsModal.sessionDates", { count: sortedDates.length })}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {showAllDates ? "▲" : "▼"}
              </span>
            </Button>
            {showAllDates && (
              <div className="mt-2 flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border/60 bg-background p-2">
                {sortedDates.map((date, index) => (
                  <span
                    key={date}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    <span className="me-1 text-[10px] text-muted-foreground">
                      #{formatNumber(index + 1, locale)}
                    </span>
                    {formatDate(date, locale)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
