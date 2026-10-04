"use client"

import { useLocale, useTranslations } from "next-intl"
import { Lightbulb, SearchCheck } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { CurrentAssignmentState } from "../scheduling-new-teacher-hiring-plan"
import { SchedulingRecoveryOption } from "../scheduling-recovery-option"
import { SchedulingStaffingFallback } from "../scheduling-staffing-fallback"
import { SchedulingTeacherAvailabilityCalendar } from "../scheduling-teacher-availability-calendar"
import { SchedulingTeacherReassignmentAnalysis } from "../scheduling-teacher-reassignment-analysis"

type UnresolvedRequirement =
  SchedulingPlanDetailsDto["unresolvedRequirements"][number]

interface SchedulingUnresolvedRequirementItemProps {
  requirement: UnresolvedRequirement
  newTeacherHiringPlan: SchedulingPlanDetailsDto["newTeacherHiringPlan"]
  planId?: string
  planStatus?: string
  assignmentsState?: Record<string, CurrentAssignmentState>
}

export function SchedulingUnresolvedRequirementItem({
  requirement,
  newTeacherHiringPlan,
  planId,
  planStatus,
  assignmentsState,
}: SchedulingUnresolvedRequirementItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const recovery = requirement.recovery ?? {
    options: [],
    totalOptionCount: 0,
    qualifiedTeacherCount: 0,
    compatibleClassroomCount: 0,
    busyTeachers: [],
    teacherCalendars: [],
    reassignmentChains: [],
    staffingFallback: {
      addTeacherSuggested: true,
      availabilityOptions: [],
    },
  }
  const visibleOptions = recovery.options.slice(0, 3)
  const hiringAssignments =
    newTeacherHiringPlan?.assignments
      .filter(
        ({ requirementId }) =>
          requirementId === requirement.classRequirement?.id
      )
      .map((assignment) => {
        const overridden = assignmentsState?.[assignment.key]
        if (
          !overridden ||
          overridden.isAssigned === false ||
          overridden.daysOfWeek.length === 0
        ) {
          return assignment
        }
        return {
          ...assignment,
          daysOfWeek: overridden.daysOfWeek,
          startTime: overridden.startTime,
          endTime: overridden.endTime,
          classroom:
            assignment.deliveryMode === "ONLINE"
              ? null
              : overridden.classroomId && overridden.classroomName
                ? {
                    id: overridden.classroomId,
                    name: overridden.classroomName,
                    capacity: assignment.classroom?.capacity ?? 1,
                  }
                : assignment.classroom,
        }
      }) ?? []

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">
            {requirement.classRequirement?.course.title ?? t("unknownCourse")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t(`unresolvedReasons.${requirement.reasonCode}`)}
          </p>
        </div>
        {requirement.missingClassCount > 0 ? (
          <Badge variant="warning" className="shrink-0 self-start">
            {t("missingCount", {
              count: formatNumber(requirement.missingClassCount, locale),
            })}
          </Badge>
        ) : (
          <Badge variant="success" className="shrink-0 self-start">
            {t("staffingFallback.resolvedBadge")}
          </Badge>
        )}
      </div>

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
                    {t("recovery.teacherConflictDescriptionWithoutSuggestion")}
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
      )}

      <SchedulingTeacherReassignmentAnalysis
        chains={recovery.reassignmentChains}
        targetCourseTitle={
          requirement.classRequirement?.course.title ?? t("unknownCourse")
        }
      />

      <SchedulingStaffingFallback
        fallback={recovery.staffingFallback}
        hiringAssignments={hiringAssignments}
        targetCourseTitle={
          requirement.classRequirement?.course.title ?? t("unknownCourse")
        }
        planId={planId}
        planStatus={planStatus}
        unresolvedRequirementId={requirement.id}
      />

      <SchedulingTeacherAvailabilityCalendar
        calendars={recovery.teacherCalendars}
      />
    </li>
  )
}
