"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, AlertTriangle } from "lucide-react"
import { PERMISSIONS, type TermDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentScheduleConfirmationBannerProps {
  term: TermDto
  onConfirmClick: () => void
  className?: string
  hasStudents?: boolean
  studentsCount?: number
}

export function StudentScheduleConfirmationBanner({
  term,
  onConfirmClick,
  className,
  hasStudents,
  studentsCount,
}: StudentScheduleConfirmationBannerProps) {
  const t = useTranslations("students.confirmStudentSchedules")

  if (Boolean(term.studentSchedulesConfirmedAt)) return null
  if (hasStudents === false || studentsCount === 0) return null
  if (term.isActive === false) return null
  if (
    term.lifecycleStatus === "COMPLETED" ||
    term.lifecycleStatus === "INACTIVE"
  ) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-foreground sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 shrink-0 text-warning" />
        <p className="text-sm font-semibold text-foreground">
          {t("bannerTitle")}
        </p>
      </div>

      <PermissionGuard
        permission={PERMISSIONS.APPROVE_STUDENTS_TIME}
        mode="hide"
      >
        <Button
          type="button"
          onClick={onConfirmClick}
          className="shrink-0 gap-2 font-medium"
        >
          <Clock className="size-4" />
          <span>{t("button")}</span>
        </Button>
      </PermissionGuard>
    </div>
  )
}
