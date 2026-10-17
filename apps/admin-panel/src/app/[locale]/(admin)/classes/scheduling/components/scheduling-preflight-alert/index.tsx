"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export interface SchedulingPreflightAlertProps {
  hasNoTeachers: boolean
  hasNoTeacherSchedule: boolean
  hasNoBranchClassrooms: boolean
  hasNoFinanceInfo?: boolean
  className?: string
}

export function SchedulingPreflightAlert({
  hasNoTeachers,
  hasNoTeacherSchedule,
  hasNoBranchClassrooms,
  hasNoFinanceInfo,
  className,
}: SchedulingPreflightAlertProps) {
  const t = useTranslations("scheduling.preflight")

  const showFinanceError = Boolean(hasNoFinanceInfo)
  const showTeachersError = hasNoTeachers || hasNoTeacherSchedule
  const showClassroomsError = hasNoBranchClassrooms

  if (!showFinanceError && !showTeachersError && !showClassroomsError) {
    return null
  }

  return (
    <div
      role="alert"
      data-testid="scheduling-preflight-alert"
      className={cn("flex flex-col gap-3", className)}
    >
      {showFinanceError && (
        <div
          data-testid="preflight-finance-error"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-foreground sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-destructive">
                {t("noFinanceInfo")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("noFinanceInfoDescription")}
              </p>
            </div>
          </div>
          <Link
            href="/institutes"
            className="inline-flex h-9 shrink-0 items-center justify-center self-end rounded-xl border border-destructive/40 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 sm:self-auto"
          >
            {t("manageInstitute")}
          </Link>
        </div>
      )}
      {showTeachersError && (
        <div
          data-testid="preflight-teacher-error"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-foreground sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-destructive">
                {hasNoTeachers ? t("noTeachers") : t("noTeacherSchedule")}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasNoTeachers
                  ? t("noTeachersDescription")
                  : t("noTeacherScheduleDescription")}
              </p>
            </div>
          </div>
          <Link
            href="/teachers"
            className="inline-flex h-9 shrink-0 items-center justify-center self-end rounded-xl border border-destructive/40 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 sm:self-auto"
          >
            {t("manageTeachers")}
          </Link>
        </div>
      )}

      {showClassroomsError && (
        <div
          data-testid="preflight-classroom-error"
          className="flex flex-col justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-foreground sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-destructive">
                {t("noBranchClassrooms")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("noBranchClassroomsDescription")}
              </p>
            </div>
          </div>
          <Link
            href="/classrooms"
            className="inline-flex h-9 shrink-0 items-center justify-center self-end rounded-xl border border-destructive/40 bg-destructive/10 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 sm:self-auto"
          >
            {t("manageClassrooms")}
          </Link>
        </div>
      )}
    </div>
  )
}
