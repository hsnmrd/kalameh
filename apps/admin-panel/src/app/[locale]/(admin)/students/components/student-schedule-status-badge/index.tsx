"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Clock } from "lucide-react"
import type { StudentScheduleStatus } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

export interface StudentScheduleStatusBadgeProps {
  scheduleStatus?: StudentScheduleStatus | null
  className?: string
}

export function StudentScheduleStatusBadge({
  scheduleStatus,
  className,
}: StudentScheduleStatusBadgeProps) {
  const t = useTranslations("students")
  const isComplete = scheduleStatus === "COMPLETE"
  const label = isComplete
    ? t("scheduleStatus.complete")
    : t("scheduleStatus.incomplete")

  return (
    <Badge
      variant="outline"
      title={label}
      aria-label={label}
      className={cn(
        isComplete
          ? "border-success/30 bg-success/15 text-success hover:bg-success/25"
          : "border-muted-foreground/30 bg-muted/40 text-muted-foreground hover:bg-muted/60",
        isComplete ? "gap-0 px-1.5 sm:gap-1 sm:px-2.5" : "gap-1",
        className
      )}
    >
      {isComplete ? (
        <Check className="size-3 text-inherit" />
      ) : (
        <Clock className="size-3 text-inherit" />
      )}
      <span
        className={cn(
          "text-[11px] font-medium",
          isComplete && "hidden sm:inline"
        )}
      >
        {label}
      </span>
    </Badge>
  )
}
