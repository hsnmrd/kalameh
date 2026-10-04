"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Clock } from "lucide-react"
import type { StudentScheduleStatus } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"

export interface StudentScheduleStatusBadgeProps {
  scheduleStatus?: StudentScheduleStatus | null
}

export function StudentScheduleStatusBadge({
  scheduleStatus,
}: StudentScheduleStatusBadgeProps) {
  const t = useTranslations("students")
  const isComplete = scheduleStatus === "COMPLETE"

  return (
    <Badge
      variant="outline"
      className={
        isComplete
          ? "gap-1 border-success/30 bg-success/15 text-success hover:bg-success/25"
          : "gap-1 border-muted-foreground/30 bg-muted/40 text-muted-foreground hover:bg-muted/60"
      }
    >
      {isComplete ? (
        <Check className="size-3 text-inherit" />
      ) : (
        <Clock className="size-3 text-inherit" />
      )}
      <span className="text-[11px] font-medium">
        {isComplete
          ? t("scheduleStatus.complete")
          : t("scheduleStatus.incomplete")}
      </span>
    </Badge>
  )
}
