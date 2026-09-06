"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Calendar, CheckCircle2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import type { TeacherDto, WeekDay } from "@workspace/types"

export interface TeacherSchedulePreviewProps {
  teacher?: TeacherDto | null
  className?: string
}

export function TeacherSchedulePreview({
  teacher,
  className,
}: TeacherSchedulePreviewProps) {
  const t = useTranslations("classes")

  if (!teacher) {
    return null
  }

  const availabilities = teacher.teacherProfile?.availabilities || []
  const hasSlots = availabilities.length > 0

  return (
    <div
      className={cn(
        "flex animate-in flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs transition-all fade-in-50",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-primary">
          <Clock className="size-4 shrink-0 text-primary" />
          <span>{t("teacherSchedule.title")}</span>
        </div>

        {hasSlots ? (
          <Badge
            variant="outline"
            className="h-5 border-primary/30 bg-primary/10 px-2 text-[10px] font-medium text-primary"
          >
            {t("teacherSchedule.slotsCount", { count: availabilities.length })}
          </Badge>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-muted-foreground" />
            <span>{t("teacherSchedule.noRestrictions")}</span>
          </span>
        )}
      </div>

      {hasSlots && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {availabilities.map((slot, index) => {
            const dayLabel = t(
              `scheduleWizard.days.${slot.dayOfWeek as WeekDay}` as any
            )
            return (
              <div
                key={slot.id || index}
                className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground shadow-2xs"
              >
                <Calendar className="size-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{dayLabel}</span>
                <span className="text-muted-foreground" dir="ltr">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
