"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  DoorOpen,
} from "lucide-react"
import type {
  SchedulingNewTeacherHiringAssignment,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface AssignmentItemProps {
  assignment: SchedulingNewTeacherHiringAssignment
  index: number
  assignedState?: {
    daysOfWeek: WeekDay[]
    startTime: string
    endTime: string
    classroomId: string | null
    classroomName: string | null
    isAssigned?: boolean
  }
}

export function AssignmentItem({
  assignment,
  index,
  assignedState,
}: AssignmentItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const isOnline = assignment.deliveryMode === "ONLINE"
  const currentRoomName =
    assignedState?.classroomName ?? assignment.classroom?.name
  const needsRoom = !isOnline && !currentRoomName

  const isAssigned =
    assignedState?.isAssigned !== false &&
    Boolean(assignedState?.daysOfWeek?.length) &&
    Boolean(assignedState?.startTime) &&
    Boolean(assignedState?.endTime)

  const daysLabel =
    isAssigned && assignedState
      ? assignedState.daysOfWeek
          .map((day) => t(`weekDays.${day}`))
          .join(t("daySeparator"))
      : ""

  const handleScrollToCalendar = () => {
    const el = document.getElementById("plan-proposals-title")
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{formatNumber(index + 1, locale)}</Badge>
          <span className="text-sm font-bold text-foreground">
            {t("hiringPlan.courseClass", {
              course: assignment.course.title,
              number: formatNumber(assignment.classNumber, locale),
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "secondary" : "outline"}>
            {isOnline ? t("hiringPlan.online") : t("deliveryModes.IN_PERSON")}
          </Badge>
          <div
            className={
              needsRoom
                ? "flex items-center gap-1.5 text-xs font-medium text-warning-foreground"
                : "flex items-center gap-1.5 text-xs text-muted-foreground"
            }
          >
            <DoorOpen aria-hidden className="size-4 shrink-0" />
            <span>
              {isOnline
                ? t("hiringPlan.online")
                : currentRoomName
                  ? t("hiringPlan.room", { room: currentRoomName })
                  : t("hiringPlan.roomNeeded")}
            </span>
          </div>
        </div>
      </div>

      {isAssigned && assignedState ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <CalendarClock
              aria-hidden
              className="size-4 text-muted-foreground"
            />
            <span>
              {daysLabel} · {assignedState.startTime}–{assignedState.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px] font-medium">
              {t("calendarView.assignedInCalendar")}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleScrollToCalendar}
              className="h-7 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="size-3" />
              <span>{t("calendarView.scrollToCalendar")}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-warning/50 bg-warning/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-warning-foreground">
            <AlertCircle aria-hidden className="size-4 shrink-0 text-warning" />
            <span>{t("calendarView.unassignedInCalendar")}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleScrollToCalendar}
            className="h-7 gap-1 rounded-lg px-2 text-xs text-warning-foreground hover:bg-warning/10"
          >
            <CalendarDays className="size-3" />
            <span>{t("calendarView.scrollToCalendar")}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
