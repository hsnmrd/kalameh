"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { GitBranch } from "lucide-react"
import type {
  CourseLevelNode,
  SchedulingBranchScheduleStatus,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../../scheduling-new-teacher-assignment-list"
import {
  findFreeMastersForSlot,
  type FreeMasterItem,
} from "../free-masters-selection/helper/teacher-level-comparison.helper"
import { BranchGroupCard } from "./branch-group-card"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface OtherBranchesMastersSectionProps {
  proposal: Proposal | null
  hiringAssignment?: NewTeacherAssignment | null
  targetCourse: CourseLevelNode
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  teacherCalendars?: SchedulingTeacherCalendar[]
  allProposals?: Proposal[]
  targetBranchId?: string | null
  branchScheduleStatuses?: SchedulingBranchScheduleStatus[]
  onAssignTeacher?: (
    proposal: Proposal,
    teacherId: string
  ) => Promise<void> | void
  onAssignMissedClassTeacher?: (
    assignment: NewTeacherAssignment,
    teacherId: string
  ) => Promise<void> | void
  isPending?: boolean
}

interface BranchGroup {
  branchId: string
  branchName: string
  hasDefinedSchedule: boolean
  scheduleStatus: "NOT_SCHEDULED" | "SCHEDULED" | "PUBLISHED"
  masters: FreeMasterItem[]
}

export function OtherBranchesMastersSection({
  proposal,
  hiringAssignment,
  targetCourse,
  daysOfWeek,
  startTime,
  endTime,
  teacherCalendars = [],
  allProposals = [],
  targetBranchId,
  branchScheduleStatuses = [],
  onAssignTeacher,
  onAssignMissedClassTeacher,
  isPending = false,
}: OtherBranchesMastersSectionProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [assigningTeacherId, setAssigningTeacherId] = React.useState<
    string | null
  >(null)

  const effectiveBranchId =
    targetBranchId ??
    proposal?.branch?.id ??
    (proposal as { branchId?: string | null } | undefined)?.branchId ??
    hiringAssignment?.branchId ??
    null

  const otherBranchMasters = React.useMemo(() => {
    if (!daysOfWeek.length || !startTime || !endTime) return []
    const all = findFreeMastersForSlot({
      targetCourse,
      daysOfWeek,
      startTime,
      endTime,
      ignoredProposalId: proposal?.id,
      teacherCalendars,
      allProposals,
      targetBranchId: effectiveBranchId,
    })
    return all.filter((m) => m.isOtherBranch)
  }, [
    targetCourse,
    daysOfWeek,
    startTime,
    endTime,
    proposal?.id,
    teacherCalendars,
    allProposals,
    effectiveBranchId,
  ])

  const branchGroups = React.useMemo(() => {
    const map = new Map<string, BranchGroup>()

    for (const master of otherBranchMasters) {
      const bId = master.branch?.id ?? "unknown-branch"
      const bName =
        master.branch?.name || t("staffingFallback.otherBranchesTitle")
      let group = map.get(bId)
      if (!group) {
        const statusItem = branchScheduleStatuses.find(
          (s) => s.branchId === bId
        )
        const hasDefinedSchedule = Boolean(statusItem?.hasDefinedSchedule)
        const scheduleStatus = statusItem?.status ?? "NOT_SCHEDULED"
        group = {
          branchId: bId,
          branchName: bName,
          hasDefinedSchedule,
          scheduleStatus,
          masters: [],
        }
        map.set(bId, group)
      }
      group.masters.push(master)
    }

    return Array.from(map.values())
  }, [otherBranchMasters, branchScheduleStatuses, t])

  const canAssign = Boolean(
    (proposal && onAssignTeacher) ||
    (hiringAssignment && onAssignMissedClassTeacher)
  )

  const handleAssign = async (teacherId: string) => {
    if (!canAssign || isPending) return
    setAssigningTeacherId(teacherId)
    try {
      if (proposal && onAssignTeacher) {
        await onAssignTeacher(proposal, teacherId)
      } else if (hiringAssignment && onAssignMissedClassTeacher) {
        await onAssignMissedClassTeacher(hiringAssignment, teacherId)
      }
    } finally {
      setAssigningTeacherId(null)
    }
  }

  if (otherBranchMasters.length === 0) {
    return null
  }

  return (
    <section
      data-testid="other-branches-masters-section"
      className="space-y-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-2xs"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch aria-hidden className="size-4 shrink-0 text-primary" />
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {t("staffingFallback.otherBranchesTitle")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("staffingFallback.otherBranchesDescription")}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-xs font-semibold text-primary"
        >
          {t("staffingFallback.otherBranchesCount", {
            count: formatNumber(otherBranchMasters.length, locale),
            branchCount: formatNumber(branchGroups.length, locale),
          })}
        </Badge>
      </div>

      {/* Branch Groups */}
      <div className="space-y-3">
        {branchGroups.map((group) => (
          <BranchGroupCard
            key={group.branchId}
            branchId={group.branchId}
            branchName={group.branchName}
            hasDefinedSchedule={group.hasDefinedSchedule}
            scheduleStatus={group.scheduleStatus}
            masters={group.masters}
            canAssign={canAssign}
            isPending={isPending}
            assigningTeacherId={assigningTeacherId}
            onAssign={handleAssign}
          />
        ))}
      </div>
    </section>
  )
}
