"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, UserCheck } from "lucide-react"
import type { SchedulingTeacherCalendar } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/routing"

export interface SchedulingPlanUnfilledTeachersProps {
  calendars: SchedulingTeacherCalendar[]
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
        return {
          teacher: calendar.teacher,
          freeSlots,
        }
      })
      .filter((t) => t.freeSlots.length > 0)
  }, [calendars])

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
          {unfilledTeachers.map(({ teacher, freeSlots }) => (
            <div
              key={teacher.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs"
            >
              <span
                className="size-2 shrink-0 rounded-full bg-warning"
                aria-hidden="true"
              />
              <span className="font-semibold text-foreground">
                {teacher.firstName} {teacher.lastName}
              </span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] text-muted-foreground"
              >
                {t("unfilledTeachers.freeSlotsCount", {
                  count: formatNumber(freeSlots.length, locale),
                })}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          {t("unfilledTeachers.allFilled")}
        </div>
      )}
    </section>
  )
}
