"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarRange, Info } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { SchedulingPlanCalendarDay } from "../scheduling-plan-calendar-day"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

const ORDERED_WEEK_DAYS = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const

interface SchedulingPlanCalendarViewProps {
  proposals: Proposal[]
  canEdit: boolean
}

export function SchedulingPlanCalendarView({
  proposals,
  canEdit,
}: SchedulingPlanCalendarViewProps) {
  const t = useTranslations("scheduling.planDetails")

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

    // Sort each day's classes by startTime
    for (const day of ORDERED_WEEK_DAYS) {
      map[day]?.sort((a, b) => a.startTime.localeCompare(b.startTime))
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

      {/* 7-Day Responsive Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7">
        {ORDERED_WEEK_DAYS.map((day) => (
          <SchedulingPlanCalendarDay
            key={day}
            dayKey={day}
            dayLabel={t(`weekDays.${day}`)}
            proposals={proposalsByDay[day] ?? []}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  )
}
