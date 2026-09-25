"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarRange, Clock3, Info } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarClassCard } from "../scheduling-plan-calendar-class-card"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export const ORDERED_WEEK_DAYS = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const

interface TimeSlot {
  startTime: string
  endTime: string
  key: string
}

interface SchedulingPlanCalendarViewProps {
  proposals: Proposal[]
  canEdit: boolean
}

export function SchedulingPlanCalendarView({
  proposals,
  canEdit,
}: SchedulingPlanCalendarViewProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const timeSlots = React.useMemo<TimeSlot[]>(() => {
    const slotsMap = new Map<string, TimeSlot>()
    for (const proposal of proposals) {
      const key = `${proposal.startTime}-${proposal.endTime}`
      if (!slotsMap.has(key)) {
        slotsMap.set(key, {
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          key,
        })
      }
    }
    return Array.from(slotsMap.values()).sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime)
    )
  }, [proposals])

  const proposalsByDayAndSlot = React.useMemo(() => {
    const map = new Map<string, Proposal[]>()
    for (const proposal of proposals) {
      for (const day of proposal.daysOfWeek) {
        const key = `${day}-${proposal.startTime}-${proposal.endTime}`
        const existing = map.get(key)
        if (existing) {
          existing.push(proposal)
        } else {
          map.set(key, [proposal])
        }
      }
    }
    return map
  }, [proposals])

  const proposalsByDay = React.useMemo(() => {
    const map: Record<string, Proposal[]> = {}
    for (const day of ORDERED_WEEK_DAYS) {
      map[day] = []
    }
    for (const proposal of proposals) {
      for (const day of proposal.daysOfWeek) {
        if (map[day]) {
          map[day].push(proposal)
        }
      }
    }
    return map
  }, [proposals])

  if (proposals.length === 0) {
    return (
      <Empty variant="compact" className="mt-4 bg-muted/30">
        <EmptyMedia>
          <CalendarRange aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("noProposals.title")}</EmptyTitle>
          <EmptyDescription>{t("noProposals.description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Informational Subtitle */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Info aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span>{t("calendarView.allInOneNotice")}</span>
      </div>

      {/* Timetable Matrix Grid with Horizontal Scroll */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
        <div className="min-w-[960px]">
          {/* Header Row */}
          <div className="grid grid-cols-[96px_repeat(7,minmax(120px,1fr))] gap-2 border-b border-border bg-muted/40 p-2.5">
            {/* Time Column Header */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Clock3 aria-hidden className="size-3.5 text-muted-foreground" />
              <span>{t("calendarView.timeColumn")}</span>
            </div>

            {/* 7 Day Column Headers */}
            {ORDERED_WEEK_DAYS.map((day) => {
              const dayProposalsCount = proposalsByDay[day]?.length ?? 0
              return (
                <div
                  key={day}
                  data-day-header={day}
                  className="flex flex-col items-center justify-center gap-1 p-1 text-center"
                >
                  <span className="text-xs font-bold text-foreground">
                    {t(`weekDays.${day}`)}
                  </span>
                  {dayProposalsCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 py-0 text-[10px]"
                    >
                      {t("calendarView.classesCount", {
                        count: formatNumber(dayProposalsCount, locale),
                      })}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 py-0 text-[10px] text-muted-foreground"
                    >
                      {t("calendarView.weekendOff")}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time Slot Rows */}
          <div className="flex flex-col divide-y divide-border/50">
            {timeSlots.map((slot) => (
              <div
                key={slot.key}
                data-testid={`time-slot-row-${slot.key}`}
                className="grid grid-cols-[96px_repeat(7,minmax(120px,1fr))] items-stretch gap-2 p-2"
              >
                {/* Time Column Cell */}
                <div
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border/40 bg-muted/30 p-2 text-center"
                  aria-label={t("timeRange", {
                    start: slot.startTime,
                    end: slot.endTime,
                  })}
                >
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {slot.startTime}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("calendarView.timeTo")}
                  </span>
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {slot.endTime}
                  </span>
                </div>

                {/* Day Cells */}
                {ORDERED_WEEK_DAYS.map((day) => {
                  const cellProposals =
                    proposalsByDayAndSlot.get(
                      `${day}-${slot.startTime}-${slot.endTime}`
                    ) ?? []

                  return (
                    <div
                      key={`${day}-${slot.key}`}
                      data-day={day}
                      data-slot={slot.key}
                      className="flex min-h-[68px] flex-col gap-2"
                    >
                      {cellProposals.length > 0 ? (
                        cellProposals.map((proposal) => (
                          <SchedulingPlanCalendarClassCard
                            key={`${proposal.id}-${day}`}
                            proposal={proposal}
                            canEdit={canEdit}
                          />
                        ))
                      ) : (
                        <div className="flex h-full min-h-[68px] items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/5 text-muted-foreground/30">
                          <span className="text-xs select-none">—</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
