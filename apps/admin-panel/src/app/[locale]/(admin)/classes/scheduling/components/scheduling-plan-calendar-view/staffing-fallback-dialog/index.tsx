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
import { SchedulingTeacherAvailabilityCalendar } from "../../scheduling-teacher-availability-calendar"
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

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        data-testid="staffing-fallback-dialog"
        className="max-w-3xl overflow-hidden p-0 sm:max-w-3xl"
      >
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle className="text-base font-semibold">
            {t("staffingFallback.title")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>
        <div className="max-h-[80vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Header Card with Course Title, Unresolved Reason & Missing Count Badge */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {effectiveCourseTitle}
                </p>
                {requirement?.reasonCode && (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t(`unresolvedReasons.${requirement.reasonCode}`)}
                  </p>
                )}
              </div>
              {requirement ? (
                requirement.missingClassCount > 0 ? (
                  <Badge variant="warning" className="shrink-0 self-start">
                    {t("missingCount", {
                      count: formatNumber(
                        requirement.missingClassCount,
                        locale
                      ),
                    })}
                  </Badge>
                ) : (
                  <Badge variant="success" className="shrink-0 self-start">
                    {t("staffingFallback.resolvedBadge")}
                  </Badge>
                )
              ) : null}
            </div>
          </div>

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
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <Lightbulb
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {t(
                          recovery.busyTeachers.length > 0
                            ? "recovery.teacherConflictTitle"
                            : "recovery.noOptionTitle"
                        )}
                      </p>
                      {recovery.busyTeachers.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ·{" "}
                          {t(
                            "recovery.teacherConflictDescriptionWithoutSuggestion"
                          )}
                        </span>
                      )}
                    </div>
                    {recovery.busyTeachers.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {recovery.busyTeachers.map((teacher) => (
                          <Badge
                            key={teacher.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {teacher.firstName} {teacher.lastName}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
            />
          )}

          {/* Teacher Availability Calendar */}
          {recovery.teacherCalendars.length > 0 && (
            <SchedulingTeacherAvailabilityCalendar
              calendars={recovery.teacherCalendars}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
