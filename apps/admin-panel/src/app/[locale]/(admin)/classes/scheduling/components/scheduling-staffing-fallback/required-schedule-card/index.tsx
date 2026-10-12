"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import type { NewTeacherAssignment } from "../../scheduling-new-teacher-assignment-list"

export interface RequiredScheduleCardProps {
  assignments: NewTeacherAssignment[]
}

export function RequiredScheduleCard({
  assignments,
}: RequiredScheduleCardProps) {
  const t = useTranslations("scheduling.planDetails")

  if (assignments.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
      <div className="flex items-start gap-2.5">
        <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("staffingFallback.requiredScheduleBadge")}
            </Badge>
            <p className="text-xs font-semibold text-foreground">
              {t("staffingFallback.requiredScheduleTitle")}
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.requiredScheduleDescription")}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {assignments.map((a) => {
              const days = a.daysOfWeek
                .map((day) => t(`weekDays.${day}`))
                .join(t("daySeparator"))
              return (
                <Badge key={a.key} variant="outline" className="text-xs">
                  {days} · {a.startTime}–{a.endTime}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
