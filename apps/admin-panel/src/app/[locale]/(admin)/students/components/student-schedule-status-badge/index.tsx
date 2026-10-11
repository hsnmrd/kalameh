"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Clock } from "lucide-react"
import type { StudentScheduleStatus } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"

export interface StudentScheduleStatusBadgeProps {
  scheduleStatus?: StudentScheduleStatus | null
  showLabel?: boolean
  className?: string
}

export function StudentScheduleStatusBadge({
  scheduleStatus,
  showLabel = false,
  className,
}: StudentScheduleStatusBadgeProps) {
  const t = useTranslations("students")

  if (!scheduleStatus) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>—</span>
    )
  }

  const isComplete = scheduleStatus === "COMPLETE"
  const label = isComplete
    ? t("scheduleStatus.complete")
    : t("scheduleStatus.incomplete")

  const icon = isComplete ? (
    <Check className="size-4 shrink-0 text-inherit" />
  ) : (
    <Clock className="size-4 shrink-0 text-inherit" />
  )

  if (showLabel) {
    return (
      <div
        title={label}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          isComplete ? "text-success" : "text-muted-foreground",
          className
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        isComplete ? "text-success" : "text-muted-foreground",
        className
      )}
    >
      {icon}
    </span>
  )
}
