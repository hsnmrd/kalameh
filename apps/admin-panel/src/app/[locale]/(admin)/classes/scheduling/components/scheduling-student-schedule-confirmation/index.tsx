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
        "flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-foreground",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{t("title")}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("unconfirmedDescription")}
        </p>
      </div>
    </div>
  )
}
