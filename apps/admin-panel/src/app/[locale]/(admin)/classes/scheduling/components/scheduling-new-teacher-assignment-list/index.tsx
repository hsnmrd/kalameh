"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, CalendarX2, DoorOpen } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

export type NewTeacherAssignment = NonNullable<
  SchedulingPlanDetailsDto["newTeacherHiringPlan"]
>["assignments"][number]

interface SchedulingNewTeacherAssignmentListProps {
  assignments: NewTeacherAssignment[]
}

export function SchedulingNewTeacherAssignmentList({
  assignments,
}: SchedulingNewTeacherAssignmentListProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  if (assignments.length === 0) {
    return (
      <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
        <CalendarX2
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">
            {t("staffingFallback.newTeacherScheduleEmptyTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.newTeacherScheduleEmptyDescription")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-start gap-2">
        <CalendarClock
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-foreground"
        />
        <div>
          <p className="text-xs font-semibold text-foreground">
            {t("staffingFallback.newTeacherTimesTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.newTeacherTimesDescription")}
          </p>
        </div>
      </div>

      <ul className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg bg-background">
        {assignments.map((assignment) => {
          const days = assignment.daysOfWeek
            .map((day) => t(`weekDays.${day}`))
            .join(t("daySeparator"))
          const needsRoom =
            assignment.deliveryMode === "IN_PERSON" &&
            assignment.classroom === null

          return (
            <li key={assignment.key} className="px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {t("hiringPlan.courseClass", {
                    course: assignment.course.title,
                    number: formatNumber(assignment.classNumber, locale),
                  })}
                </p>
                <Badge variant="outline">
                  {days} · {assignment.startTime}–{assignment.endTime}
                </Badge>
              </div>
              <div
                className={
                  needsRoom
                    ? "mt-2 flex items-center gap-1.5 text-xs text-warning-foreground"
                    : "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
                }
              >
                <DoorOpen aria-hidden className="size-4 shrink-0" />
                <span>
                  {assignment.deliveryMode === "ONLINE"
                    ? t("hiringPlan.online")
                    : needsRoom
                      ? t("hiringPlan.roomNeeded")
                      : t("hiringPlan.room", {
                          room: assignment.classroom?.name ?? "",
                        })}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
