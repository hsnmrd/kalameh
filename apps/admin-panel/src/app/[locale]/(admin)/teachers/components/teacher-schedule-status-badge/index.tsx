"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Clock } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface TeacherScheduleStatusBadgeProps {
  availabilitiesCount?: number
  hasSchedule?: boolean
  showCount?: boolean
  className?: string
}

export function TeacherScheduleStatusBadge({
  availabilitiesCount = 0,
  hasSchedule = availabilitiesCount > 0,
  showCount = false,
  className,
}: TeacherScheduleStatusBadgeProps) {
  const t = useTranslations("teachers")
  const isScheduled = hasSchedule || availabilitiesCount > 0

  const label = isScheduled
    ? showCount && availabilitiesCount > 0
      ? t("availabilities.slotsCount", { count: availabilitiesCount })
      : t("scheduleStatus.scheduled")
    : t("scheduleStatus.noSchedule")

  return (
    <Badge
      variant={isScheduled ? "success" : "secondary"}
      className={cn(
        "gap-1.5 px-3 py-1 text-xs font-semibold shadow-xs",
        className
      )}
    >
      {isScheduled ? (
        <Check className="size-3.5 text-inherit" />
      ) : (
        <Clock className="size-3.5 text-inherit" />
      )}
      <span>{label}</span>
    </Badge>
  )
}
