"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { SearchCheck } from "lucide-react"
import type {
  CourseLevelNode,
  SchedulingBranchScheduleStatus,
  SchedulingPlanDetailsDto,
  SchedulingRecoveryOption,
  SchedulingStaffingFallback as StaffingFallbackDto,
  SchedulingTeacherCalendar,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../scheduling-new-teacher-assignment-list"
import { RecoveryOptionsSelection } from "./recovery-options-selection"
import { SchedulingStaffingFallback } from "../../scheduling-staffing-fallback"
import { SchedulingStaffingOrDivider } from "../../scheduling-staffing-or-divider"
import { SchedulingTeacherReassignmentAnalysis } from "../../scheduling-teacher-reassignment-analysis"
import { FreeMastersSelection } from "./free-masters-selection"
import { findFreeMastersForSlot } from "./free-masters-selection/helper/teacher-level-comparison.helper"
import { OtherBranchesMastersSection } from "./other-branches-masters-section"

type UnresolvedRequirement =
  SchedulingPlanDetailsDto["unresolvedRequirements"][number]
type Proposal = SchedulingPlanDetailsDto["proposals"][number]

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
  proposal?: Proposal | null
  teacherCalendars?: SchedulingTeacherCalendar[]
  allProposals?: Proposal[]
  branchId?: string | null
  branchScheduleStatuses?: SchedulingBranchScheduleStatus[]
  onAssignTeacher?: (
    proposal: Proposal,
    teacherId: string
  ) => Promise<void> | void
  onAssignMissedClassTeacher?: (
    assignment: NewTeacherAssignment,
    teacherId: string
  ) => Promise<void> | void
  onApplyRecoveryOption?: (
    option: SchedulingRecoveryOption
  ) => Promise<void> | void
  isAssignPending?: boolean
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
  proposal,
  teacherCalendars,
  allProposals,
  branchId,
  branchScheduleStatuses = [],
  onAssignTeacher,
  onAssignMissedClassTeacher,
  onApplyRecoveryOption,
  isAssignPending = false,
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
        phoneNumber?: string | null
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

  const targetCourse: CourseLevelNode = React.useMemo(() => {
    if (proposal?.course) return proposal.course
    const assignmentCourse = hiringAssignments[0]?.course
    if (assignmentCourse) return assignmentCourse
    if (requirement?.classRequirement?.course)
      return requirement.classRequirement.course
    return {
      id: "unknown-course",
      title: targetCourseTitle || t("unknownCourse"),
    }
  }, [
    proposal?.course,
    hiringAssignments,
    requirement?.classRequirement?.course,
    targetCourseTitle,
    t,
  ])

  const targetDaysOfWeek = React.useMemo(() => {
    if (proposal?.daysOfWeek?.length) return proposal.daysOfWeek
    if (hiringAssignments[0]?.daysOfWeek?.length)
      return hiringAssignments[0].daysOfWeek
    return []
  }, [proposal?.daysOfWeek, hiringAssignments])

  const targetStartTime =
    proposal?.startTime ?? hiringAssignments[0]?.startTime ?? ""
  const targetEndTime = proposal?.endTime ?? hiringAssignments[0]?.endTime ?? ""

  const effectiveBranchId =
    branchId ??
    proposal?.branch?.id ??
    (proposal as { branchId?: string | null } | undefined)?.branchId ??
    null

  const hasFreeMasters = React.useMemo(() => {
    if (!targetDaysOfWeek.length || !targetStartTime || !targetEndTime) {
      return false
    }
    const all = findFreeMastersForSlot({
      targetCourse,
      daysOfWeek: targetDaysOfWeek,
      startTime: targetStartTime,
      endTime: targetEndTime,
      ignoredProposalId: proposal?.id,
      teacherCalendars,
      allProposals,
      targetBranchId: effectiveBranchId,
    })
    return all.some((m) => !m.isOtherBranch)
  }, [
    targetDaysOfWeek,
    targetStartTime,
    targetEndTime,
    targetCourse,
    proposal?.id,
    teacherCalendars,
    allProposals,
    effectiveBranchId,
  ])

  const hasRecoveryOptions = visibleOptions.length > 0
  const hasReassignment = recovery.reassignmentChains.length > 0
  const hasStaffingFallback = Boolean(
    effectiveFallback &&
    (effectiveFallback.availabilityOptions.length > 0 ||
      unavailableTeachers.length > 0)
  )

  let branchCounter = 0
  const branch1Number = hasFreeMasters ? ++branchCounter : undefined
  const branchRecoveryNumber = hasRecoveryOptions ? ++branchCounter : undefined
  const branch2Number = hasReassignment ? ++branchCounter : undefined
  const branch3Number = hasStaffingFallback ? ++branchCounter : undefined

  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent
        data-testid="staffing-fallback-dialog"
        className="sm:max-w-3xl"
      >
        <FormDialogHeader>
          <FormDialogTitle className="text-base font-semibold">
            {effectiveCourseTitle
              ? `${t("staffingFallback.title")} · ${effectiveCourseTitle}`
              : t("staffingFallback.title")}
          </FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:max-h-[80vh] sm:px-6 sm:py-5">
          {/* Option of choosing from Free Masters in this period with level comparison */}
          {targetDaysOfWeek.length > 0 && targetStartTime && targetEndTime && (
            <FreeMastersSelection
              branchNumber={branch1Number}
              proposal={proposal ?? null}
              hiringAssignment={hiringAssignments[0] ?? null}
              targetCourse={targetCourse}
              daysOfWeek={targetDaysOfWeek}
              startTime={targetStartTime}
              endTime={targetEndTime}
              teacherCalendars={teacherCalendars}
              allProposals={allProposals}
              targetBranchId={effectiveBranchId}
              onAssignTeacher={
                onAssignTeacher
                  ? async (prop, teacherId) => {
                      await onAssignTeacher(prop, teacherId)
                      onOpenChange(false)
                    }
                  : undefined
              }
              onAssignMissedClassTeacher={
                onAssignMissedClassTeacher
                  ? async (assignment, teacherId) => {
                      await onAssignMissedClassTeacher(assignment, teacherId)
                      onOpenChange(false)
                    }
                  : undefined
              }
              isPending={isAssignPending}
            />
          )}

          {/* Option of choosing from Free Masters in other branches grouped with schedule status */}
          {targetDaysOfWeek.length > 0 && targetStartTime && targetEndTime && (
            <OtherBranchesMastersSection
              proposal={proposal ?? null}
              hiringAssignment={hiringAssignments[0] ?? null}
              targetCourse={targetCourse}
              daysOfWeek={targetDaysOfWeek}
              startTime={targetStartTime}
              endTime={targetEndTime}
              teacherCalendars={teacherCalendars}
              allProposals={allProposals}
              targetBranchId={effectiveBranchId}
              branchScheduleStatuses={branchScheduleStatuses}
              onAssignTeacher={
                onAssignTeacher
                  ? async (prop, teacherId) => {
                      await onAssignTeacher(prop, teacherId)
                      onOpenChange(false)
                    }
                  : undefined
              }
              onAssignMissedClassTeacher={
                onAssignMissedClassTeacher
                  ? async (assignment, teacherId) => {
                      await onAssignMissedClassTeacher(assignment, teacherId)
                      onOpenChange(false)
                    }
                  : undefined
              }
              isPending={isAssignPending}
            />
          )}

          {/* Divider between free masters and recovery options */}
          {hasFreeMasters && hasRecoveryOptions && (
            <SchedulingStaffingOrDivider />
          )}

          {/* Solution 2: Reschedule Class for Free Master */}
          {hasRecoveryOptions && (
            <RecoveryOptionsSelection
              branchNumber={branchRecoveryNumber}
              options={visibleOptions}
              canApply={Boolean(onApplyRecoveryOption)}
              isPending={isAssignPending}
              onApply={async (option) => {
                if (onApplyRecoveryOption) {
                  await onApplyRecoveryOption(option)
                  onOpenChange(false)
                }
              }}
            />
          )}

          {/* Divider between recovery options and reassignment */}
          {(hasFreeMasters || hasRecoveryOptions) && hasReassignment && (
            <SchedulingStaffingOrDivider />
          )}

          {/* Teacher Reassignment Analysis */}
          {(recovery.reassignmentChains.length > 0 || Boolean(requirement)) && (
            <SchedulingTeacherReassignmentAnalysis
              branchNumber={branch2Number}
              chains={recovery.reassignmentChains}
              targetCourseTitle={effectiveCourseTitle}
              planId={planId}
              planStatus={planStatus}
              unresolvedRequirementId={effectiveUnresolvedRequirementId}
              onApplyChainSuccess={() => onOpenChange(false)}
            />
          )}

          {/* Divider between alternative options */}
          {(hasFreeMasters || hasRecoveryOptions || hasReassignment) &&
            hasStaffingFallback && <SchedulingStaffingOrDivider />}

          {/* Staffing Fallback Solutions */}
          {effectiveFallback && (
            <SchedulingStaffingFallback
              branchNumber={branch3Number}
              fallback={effectiveFallback}
              targetCourseTitle={effectiveCourseTitle}
              hiringAssignments={hiringAssignments}
              planId={planId}
              planStatus={planStatus}
              unresolvedRequirementId={effectiveUnresolvedRequirementId}
              unavailableTeachers={unavailableTeachers}
              currentSchedule={
                targetDaysOfWeek.length > 0 && targetStartTime && targetEndTime
                  ? {
                      daysOfWeek: targetDaysOfWeek,
                      startTime: targetStartTime,
                      endTime: targetEndTime,
                    }
                  : null
              }
            />
          )}
        </div>
      </FormDialogContent>
    </FormDialog>
  )
}
