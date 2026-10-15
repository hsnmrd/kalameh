"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calendar, Clock, Edit2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { WEEK_DAYS, type StudentDto, type WeekDay } from "@workspace/types"

export interface StudentScheduleTabProps {
  student: StudentDto
  onManageAvailability: () => void
}

export function StudentScheduleTab({
  student,
  onManageAvailability,
}: StudentScheduleTabProps) {
  const t = useTranslations("students")
  const availabilities = student.studentProfile?.availabilities || []

  const activeDays = React.useMemo(() => {
    const map = new Map<WeekDay, typeof availabilities>()
    for (const day of WEEK_DAYS) {
      map.set(day, [])
    }
    for (const slot of availabilities) {
      const day = slot.dayOfWeek as WeekDay
      if (map.has(day)) {
        map.get(day)!.push(slot)
      }
    }
    for (const [, slots] of map) {
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return WEEK_DAYS.filter((day) => (map.get(day)?.length ?? 0) > 0).map(
      (day) => ({
        day,
        slots: map.get(day)!,
      })
    )
  }, [availabilities])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-foreground" />
          <h4 className="text-sm font-bold text-foreground sm:text-base">
            <span>برنامه زمان‌های آزاد حضور</span>
          </h4>
          {availabilities.length > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-[11px]">
              {availabilities.length} بازه زمانی
            </Badge>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onManageAvailability}
          className="h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold"
        >
          <Edit2 className="size-3.5 text-muted-foreground" />
          <span>{t("actions.availability")}</span>
        </Button>
      </div>

      {availabilities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-xs text-muted-foreground">
          <p>هیچ زمان آزادی برای این زبان‌آموز مشخص نشده است.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageAvailability}
            className="mt-3 gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>تنظیم زمان‌های آزاد</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeDays.map(({ day, slots }) => (
            <div
              key={day}
              className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground sm:text-sm">
                    {t(`days.${day}`)}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {slots.length} بازه
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {slots.map((slot, idx) => (
                  <div
                    key={
                      slot.id || `${slot.dayOfWeek}-${slot.startTime}-${idx}`
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-foreground shadow-2xs"
                  >
                    <Clock className="size-3 text-muted-foreground" />
                    <span
                      dir="ltr"
                      className="font-mono font-medium text-foreground"
                    >
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
