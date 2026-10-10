"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calendar, Clock, Edit2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { WEEK_DAYS, type TeacherDto, type WeekDay } from "@workspace/types"

interface AvailabilityScheduleProps {
  teacher: TeacherDto
  onClose: () => void
  onManage?: (teacher: TeacherDto) => void
}

export function AvailabilitySchedule({
  teacher,
  onClose,
  onManage,
}: AvailabilityScheduleProps) {
  const t = useTranslations("teachers")
  const availabilities = teacher.teacherProfile?.availabilities || []

  const handleManage = () => {
    onClose()
    onManage?.(teacher)
  }

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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-foreground" />
            <span>{t("profileModal.freeTimeSchedule")}</span>
          </h4>
          {availabilities.length > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-2 text-[11px] font-normal"
            >
              {t("availabilities.slotsCount", { count: availabilities.length })}
            </Badge>
          )}
        </div>
        {onManage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleManage}
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title={t("actions.manageAvailability")}
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
            <span>{t("table.setAvailability")}</span>
          </Button>
        )}
      </div>

      {availabilities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("availabilities.noSlots")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {activeDays.map(({ day, slots }) => (
            <div
              key={day}
              className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs transition-colors hover:border-border"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Calendar className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {t(`days.${day}`)}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t("availabilities.slotsCount", { count: slots.length })}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {slots.map((slot, idx) => (
                  <div
                    key={
                      slot.id || `${slot.dayOfWeek}-${slot.startTime}-${idx}`
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs text-foreground shadow-2xs"
                  >
                    <Clock className="size-3 text-muted-foreground" />
                    <span dir="ltr" className="font-medium text-foreground">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.branch?.name && (
                      <span className="text-[11px] text-muted-foreground before:me-1 before:content-['•']">
                        {slot.branch.name}
                      </span>
                    )}
                    {slot.term?.title && (
                      <span className="text-[10px] text-muted-foreground/80">
                        ({slot.term.title})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
