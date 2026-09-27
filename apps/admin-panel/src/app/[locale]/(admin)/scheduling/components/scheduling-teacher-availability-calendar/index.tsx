"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarClock } from "lucide-react"
import type { SchedulingTeacherCalendar } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { ORDERED_WEEK_DAYS } from "../scheduling-plan-calendar-view"

interface SchedulingTeacherAvailabilityCalendarProps {
  calendars: SchedulingTeacherCalendar[]
}

export function SchedulingTeacherAvailabilityCalendar({
  calendars,
}: SchedulingTeacherAvailabilityCalendarProps) {
  const t = useTranslations("scheduling.planDetails")
  const [selectedTeacherId, setSelectedTeacherId] = React.useState(
    calendars[0]?.teacher.id ?? ""
  )
  const selectedCalendar =
    calendars.find(({ teacher }) => teacher.id === selectedTeacherId) ??
    calendars[0]

  if (!selectedCalendar) return null

  return (
    <section
      aria-label={t("teacherCalendar.title")}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <CalendarClock
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div>
            <h5 className="text-sm font-semibold text-foreground">
              {t("teacherCalendar.title")}
            </h5>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("teacherCalendar.description")}
            </p>
          </div>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          aria-label={t("teacherCalendar.legend")}
        >
          <Badge variant="success">{t("teacherCalendar.states.FREE")}</Badge>
          <Badge variant="warning">{t("teacherCalendar.states.BUSY")}</Badge>
          <Badge variant="outline">
            {t("teacherCalendar.states.UNAVAILABLE")}
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <ToggleGroup
          value={[selectedCalendar.teacher.id]}
          onValueChange={(value) => value[0] && setSelectedTeacherId(value[0])}
          aria-label={t("teacherCalendar.teacherSelector")}
          className="min-w-max"
        >
          {calendars.map(({ teacher }) => (
            <ToggleGroupItem
              key={teacher.id}
              value={teacher.id}
              variant="outline"
              className="min-h-11 px-4"
            >
              {teacher.firstName} {teacher.lastName}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <div className="grid min-w-[920px] grid-cols-7 divide-x divide-border rtl:divide-x-reverse">
          {ORDERED_WEEK_DAYS.map((day) => {
            const slots = selectedCalendar.slots.filter(
              (slot) => slot.dayOfWeek === day
            )

            return (
              <section
                key={day}
                aria-label={t(`weekDays.${day}`)}
                className="min-w-0"
              >
                <h6 className="border-b border-border bg-muted/50 px-2 py-2.5 text-center text-xs font-bold text-foreground">
                  {t(`weekDays.${day}`)}
                </h6>
                <div className="flex min-h-40 flex-col gap-2 p-2">
                  {slots.length > 0 ? (
                    slots.map((slot, index) => (
                      <div
                        key={`${day}-${slot.startTime}-${slot.endTime}-${slot.status}-${index}`}
                        className="flex flex-col gap-1.5 rounded-xl bg-muted/50 p-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <Badge
                            variant={
                              slot.status === "FREE" ? "success" : "warning"
                            }
                          >
                            {t(`teacherCalendar.states.${slot.status}`)}
                          </Badge>
                          <span className="text-xs font-semibold text-foreground tabular-nums">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </div>
                        {slot.status === "BUSY" && (
                          <p className="text-xs leading-5 text-muted-foreground">
                            {slot.title ?? t("teacherCalendar.existingClass")}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-32 items-center justify-center rounded-xl bg-muted/30 p-3 text-center">
                      <p className="text-xs leading-5 text-muted-foreground">
                        {t("teacherCalendar.noAvailability")}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
