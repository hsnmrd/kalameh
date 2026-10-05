"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Lightbulb, SearchCheck } from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingStaffingFallback as StaffingFallbackDto,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../scheduling-new-teacher-assignment-list"
import { SchedulingRecoveryOption } from "../../scheduling-recovery-option"
import { SchedulingStaffingFallback } from "../../scheduling-staffing-fallback"
import { SchedulingTeacherReassignmentAnalysis } from "../../scheduling-teacher-reassignment-analysis"

type UnresolvedRequirement =
  SchedulingPlanDetailsDto["unresolvedRequirements"][number]

export interface StaffingFallbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fallback?: StaffingFallbackDto | null
  targetCourseTitle: string
  hiringAssignments: NewTeacherAssignment[]
  planId?: string
  planStatus?: string
  unresolvedRequirementId?: string
  requirement?: UnresolvedRequirement | null
}

export function StaffingFallbackDialog({
  open,
  onOpenChange,
  fallback,
  targetCourseTitle,
  hiringAssignments,
  planId,
  planStatus,
  unresolvedRequirementId,
  requirement,
}: StaffingFallbackDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const recovery = requirement?.recovery ?? {
    options: [],
    totalOptionCount: 0,
    qualifiedTeacherCount: 0,
    compatibleClassroomCount: 0,
    busyTeachers: [],
    teacherCalendars: [],
    reassignmentChains: [],
    staffingFallback: fallback ?? {
      addTeacherSuggested: true,
      availabilityOptions: [],
    },
  }

  const effectiveFallback = fallback ?? recovery.staffingFallback
  const effectiveUnresolvedRequirementId =
    unresolvedRequirementId ?? requirement?.id
  const effectiveCourseTitle =
    targetCourseTitle ||
    requirement?.classRequirement?.course.title ||
    t("unknownCourse")
  const visibleOptions = recovery.options.slice(0, 3)

  const outreachTeacherIds = React.useMemo(() => {
    return new Set(
      effectiveFallback?.availabilityOptions.map((opt) => opt.teacher.id) ?? []
    )
  }, [effectiveFallback])

  const unavailableTeachers = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        firstName: string
        lastName: string
        avatarUrl?: string | null
      }
    >()
    for (const tc of recovery.teacherCalendars) {
      if (!outreachTeacherIds.has(tc.teacher.id)) {
        map.set(tc.teacher.id, tc.teacher)
      }
    }
    for (const bt of recovery.busyTeachers) {
      if (!outreachTeacherIds.has(bt.id)) {
        map.set(bt.id, bt)
      }
    }
    return Array.from(map.values())
  }, [recovery.teacherCalendars, recovery.busyTeachers, outreachTeacherIds])

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        data-testid="staffing-fallback-dialog"
        className="max-w-3xl overflow-hidden p-0 sm:max-w-3xl"
      >
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle className="text-base font-semibold">
            {effectiveCourseTitle
              ? `${t("staffingFallback.title")} · ${effectiveCourseTitle}`
              : t("staffingFallback.title")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>
        <div className="max-h-[80vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Recovery Options OR Busy Teachers / No Free Teacher Callout */}
          {visibleOptions.length > 0 ? (
            <div className="rounded-xl bg-muted/40 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <SearchCheck
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {t("recovery.title")}
                    </p>
                  </div>
                </div>
                {recovery.totalOptionCount > 0 && (
                  <Badge variant="secondary">
                    {t("recovery.optionCount", {
                      total: formatNumber(recovery.totalOptionCount, locale),
                      shown: formatNumber(visibleOptions.length, locale),
                    })}
                  </Badge>
                )}
              </div>

              <ul className="mt-3 space-y-2.5">
                {visibleOptions.map((option) => (
                  <SchedulingRecoveryOption key={option.key} option={option} />
                ))}
              </ul>
            </div>
          ) : (
            (recovery.busyTeachers.length > 0 || Boolean(requirement)) && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Lightbulb
                    aria-hidden
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                  <span>
                    {t(
                      recovery.busyTeachers.length > 0
                        ? "recovery.teacherConflictTitle"
                        : "recovery.noOptionTitle"
                    )}
                  </span>
                </div>
                {recovery.busyTeachers.length > 0 && (
                  <>
                    <span className="text-muted-foreground">
                      ({t("recovery.qualifiedTeachersConflictShort")}):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {recovery.busyTeachers.map((teacher) => (
                        <Badge
                          key={teacher.id}
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {teacher.firstName} {teacher.lastName}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* Teacher Reassignment Analysis */}
          {(recovery.reassignmentChains.length > 0 || Boolean(requirement)) && (
            <SchedulingTeacherReassignmentAnalysis
              chains={recovery.reassignmentChains}
              targetCourseTitle={effectiveCourseTitle}
            />
          )}

          {/* Staffing Fallback Solutions */}
          {effectiveFallback && (
            <SchedulingStaffingFallback
              fallback={effectiveFallback}
              targetCourseTitle={effectiveCourseTitle}
              hiringAssignments={hiringAssignments}
              planId={planId}
              planStatus={planStatus}
              unresolvedRequirementId={effectiveUnresolvedRequirementId}
              unavailableTeachers={unavailableTeachers}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
