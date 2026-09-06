"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import type { ClassConflictResult, ClassConflictItem } from "@workspace/types"

export interface ScheduleConflictBannerProps {
  conflictResult: ClassConflictResult | null
  conflictMessage: string | null
}

export function ScheduleConflictBanner({
  conflictResult,
  conflictMessage,
}: ScheduleConflictBannerProps) {
  const t = useTranslations("classes.scheduleWizard")

  const conflicts = conflictResult?.conflicts

  const displayedConflicts = React.useMemo(() => {
    if (!conflicts) return []
    const classroomConflictTitles = new Set(
      conflicts
        .filter((c) => c.type === "CLASSROOM")
        .map((c) => c.conflictingClassTitle)
    )
    return conflicts.filter((c) => {
      if (
        c.type === "TEACHER" &&
        classroomConflictTitles.has(c.conflictingClassTitle)
      ) {
        return false
      }
      return true
    })
  }, [conflicts])

  if (
    conflictResult &&
    conflictResult.hasConflict &&
    displayedConflicts.length > 0
  ) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5 font-semibold text-warning">
              <span>{t("conflictBannerTitle")}</span>
              <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[11px] font-medium text-warning">
                {t("conflictDaysCount", {
                  count: conflictResult.conflictingDates.length,
                })}
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-muted-foreground">
              {displayedConflicts.map(
                (conflict: ClassConflictItem, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-foreground"
                  >
                    <span className="font-medium text-warning">
                      {conflict.type === "CLASSROOM"
                        ? t("conflictTypeClassroom")
                        : t("conflictTypeTeacher")}
                      :
                    </span>
                    <span className="font-semibold">
                      {conflict.conflictingClassTitle}
                    </span>
                    {conflict.startTime && conflict.endTime && (
                      <span className="text-muted-foreground">
                        ({conflict.startTime} - {conflict.endTime})
                      </span>
                    )}
                    {conflict.classroomName && (
                      <span className="text-muted-foreground">
                        • {conflict.classroomName}
                      </span>
                    )}
                    {conflict.teacherName && (
                      <span className="text-muted-foreground">
                        • {conflict.teacherName}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (conflictMessage) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning">
        <AlertTriangle className="size-4 shrink-0 text-warning" />
        <span>{conflictMessage}</span>
      </div>
    )
  }

  return null
}
