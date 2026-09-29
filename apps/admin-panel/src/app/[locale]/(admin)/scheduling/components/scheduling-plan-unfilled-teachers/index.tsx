"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, GraduationCap, UserCheck } from "lucide-react"
import {
  EVEN_CLASS_DAYS,
  ODD_CLASS_DAYS,
  type SchedulingTeacherCalendar,
  type WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/routing"

export interface SchedulingPlanUnfilledTeachersProps {
  calendars: SchedulingTeacherCalendar[]
}

type DayTrack = "even" | "odd" | "friday"

const TRACK_ORDER: Record<DayTrack, number> = {
  even: 0,
  odd: 1,
  friday: 2,
}

function getDayTrack(day: WeekDay): DayTrack {
  if (EVEN_CLASS_DAYS.includes(day)) return "even"
  if (ODD_CLASS_DAYS.includes(day)) return "odd"
  return "friday"
}

function formatTimeDigits(time: string, locale: string): string {
  return time.replace(/\d/g, (digit) => formatNumber(Number(digit), locale))
}

export function SchedulingPlanUnfilledTeachers({
  calendars,
}: SchedulingPlanUnfilledTeachersProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const unfilledTeachers = React.useMemo(() => {
    return calendars
      .map((calendar) => {
        const freeSlots = calendar.slots.filter((s) => s.status === "FREE")
        const summariesMap = new Map<
          string,
          {
            key: string
            track: DayTrack
            startTime: string
            endTime: string
            label: string
          }
        >()

        for (const slot of freeSlots) {
          const track = getDayTrack(slot.dayOfWeek)
          const key = `${track}:${slot.startTime}-${slot.endTime}`
          if (!summariesMap.has(key)) {
            summariesMap.set(key, {
              key,
              track,
              startTime: slot.startTime,
              endTime: slot.endTime,
              label: t("unfilledTeachers.freeSlotSummary", {
                days: t(`unfilledTeachers.dayTracks.${track}`),
                start: formatTimeDigits(slot.startTime, locale),
                end: formatTimeDigits(slot.endTime, locale),
              }),
            })
          }
        }

        const freeSummaries = Array.from(summariesMap.values()).sort(
          (a, b) =>
            TRACK_ORDER[a.track] - TRACK_ORDER[b.track] ||
            a.startTime.localeCompare(b.startTime) ||
            a.endTime.localeCompare(b.endTime)
        )

        return {
          teacher: calendar.teacher,
          teachableCourses: calendar.teachableCourses ?? [],
          freeSlots,
          freeSummaries,
        }
      })
      .filter((item) => item.freeSlots.length > 0)
  }, [calendars, locale, t])

  if (!calendars || calendars.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="plan-unfilled-teachers-title"
      className="flex flex-col gap-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserCheck
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <h4
            id="plan-unfilled-teachers-title"
            className="text-sm font-semibold text-foreground"
          >
            {t("unfilledTeachers.title")}
          </h4>
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[11px] font-medium"
          >
            {t("unfilledTeachers.count", {
              count: formatNumber(unfilledTeachers.length, locale),
            })}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/teachers/calendar" />}
          className="h-8 gap-1.5 px-2 text-xs font-medium text-primary hover:text-primary"
        >
          <CalendarClock className="size-3.5" />
          <span>{t("unfilledTeachers.viewCalendar")}</span>
        </Button>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {t("unfilledTeachers.description")}
      </p>

      {unfilledTeachers.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {unfilledTeachers.map(
            ({ teacher, teachableCourses, freeSummaries }) => (
              <div
                key={teacher.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full bg-warning"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-foreground">
                    {teacher.firstName} {teacher.lastName}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {freeSummaries.map((summary) => (
                      <Badge
                        key={summary.key}
                        variant="secondary"
                        className="h-5 px-2 text-[10px] font-medium text-muted-foreground tabular-nums"
                      >
                        {summary.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {teachableCourses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                    <GraduationCap
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                    <span>{t("unfilledTeachers.levels")}:</span>
                    {teachableCourses.map((course) => (
                      <Badge
                        key={course.id}
                        variant="outline"
                        className="h-5 bg-background px-1.5 text-[10px] font-medium text-foreground"
                      >
                        {course.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          {t("unfilledTeachers.allFilled")}
        </div>
      )}
    </section>
  )
}
