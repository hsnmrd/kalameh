"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface SchedulingStudentScheduleConfirmationProps {
  term?: {
    id: string
    title?: string
    studentSchedulesConfirmedAt?: string | Date | null
  } | null
  className?: string
}

export function SchedulingStudentScheduleConfirmation({
  term,
  className,
}: SchedulingStudentScheduleConfirmationProps) {
  const t = useTranslations("scheduling.generation.studentScheduleConfirmation")

  if (!term || Boolean(term.studentSchedulesConfirmedAt)) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-foreground",
        className
      )}
    >
      <AlertTriangle className="size-5 shrink-0 text-warning" />
      <p className="text-sm font-semibold text-foreground">{t("title")}</p>
    </div>
  )
}
