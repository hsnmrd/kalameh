"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarX2, UserPlus } from "lucide-react"
import type {
  SchedulingStaffingFallback as StaffingFallbackDto,
  SchedulingTeacherOutreachOption,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { useActiveInstitute } from "@/lib/stores"
import {
  SchedulingNewTeacherAssignmentList,
  type NewTeacherAssignment,
} from "../scheduling-new-teacher-assignment-list"
import { OutreachOptionItem } from "./outreach-option-item"

interface SchedulingStaffingFallbackProps {
  fallback: StaffingFallbackDto
  targetCourseTitle: string
  hiringAssignments: NewTeacherAssignment[]
  planId?: string
  planStatus?: string
  unresolvedRequirementId?: string
}

export function SchedulingStaffingFallback({
  fallback,
  targetCourseTitle,
  hiringAssignments,
  planId,
  planStatus,
  unresolvedRequirementId,
}: SchedulingStaffingFallbackProps) {
  const t = useTranslations("scheduling.planDetails")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [pendingOptionKey, setPendingOptionKey] = React.useState<string | null>(
    null
  )

  const canToggle =
    Boolean(planId) &&
    Boolean(unresolvedRequirementId) &&
    (!planStatus || ["DRAFT", "SELECTED"].includes(planStatus))

  const toggleMutation = useMutation({
    ...schedulingResource.toggleTeacherOutreach.toMutation(),
    onSuccess: (updatedPlan, variables) => {
      const targetOption = fallback.availabilityOptions.find(
        (opt) => opt.key === variables.body.optionKey
      )
      const wasAccepted = Boolean(targetOption?.isAccepted)
      toast.success(
        t(
          wasAccepted
            ? "staffingFallback.revertSuccess"
            : "staffingFallback.acceptSuccess"
        )
      )
      queryClient.setQueryData(
        schedulingResource.planDetail.key({
          planId: updatedPlan.id,
          ...(variables.instituteId
            ? { instituteId: variables.instituteId }
            : {}),
        }),
        updatedPlan
      )
      queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.baseKey(),
      })
    },
    onSettled: () => {
      setPendingOptionKey(null)
    },
  })

  const handleToggleOption = (option: SchedulingTeacherOutreachOption) => {
    if (!planId || !unresolvedRequirementId || toggleMutation.isPending) return
    setPendingOptionKey(option.key)
    toggleMutation.mutate({
      planId,
      ...(activeInstituteId ? { instituteId: activeInstituteId } : {}),
      body: {
        unresolvedRequirementId,
        optionKey: option.key,
        teacherId: option.teacher.id,
        deliveryMode: option.deliveryMode,
        daysOfWeek: option.daysOfWeek,
        startTime: option.startTime,
        endTime: option.endTime,
        availabilityChangeDays: option.availabilityChangeDays,
        classroomId:
          option.deliveryMode === "ONLINE"
            ? null
            : (option.availableClassrooms[0]?.id ?? null),
      },
    })
  }

  return (
    <section
      aria-label={t("staffingFallback.title")}
      className="rounded-xl border border-border p-3.5"
    >
      <div className="flex items-start gap-2">
        <UserPlus
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-foreground"
        />
        <div>
          <h5 className="text-xs font-semibold text-foreground">
            {t("staffingFallback.title")}
          </h5>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.description")}
          </p>
        </div>
      </div>

      {fallback.availabilityOptions.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-foreground">
            {t("staffingFallback.suggestedTimesTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.suggestedTimesRanking")}
          </p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {fallback.availabilityOptions.map((option, index) => (
              <OutreachOptionItem
                key={option.key}
                option={option}
                index={index}
                canToggle={canToggle}
                isPending={
                  toggleMutation.isPending && pendingOptionKey === option.key
                }
                onToggle={handleToggleOption}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 border-y border-border py-3">
          <CalendarX2
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t("staffingFallback.availabilityEmptyTitle")}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("staffingFallback.availabilityEmptyDescription")}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-xl bg-muted/40 p-3.5">
        <div className="flex items-start gap-2">
          <UserPlus
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div className="min-w-0">
            <Badge variant="outline">
              {t("staffingFallback.addTeacherBadge")}
            </Badge>
            <p className="mt-2 text-xs font-semibold text-foreground">
              {t("staffingFallback.addTeacherTitle", {
                course: targetCourseTitle,
              })}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(
                hiringAssignments.length > 0
                  ? "staffingFallback.addTeacherDescriptionWithSchedule"
                  : "staffingFallback.addTeacherDescription"
              )}
            </p>
          </div>
        </div>

        <SchedulingNewTeacherAssignmentList assignments={hiringAssignments} />
      </div>
    </section>
  )
}
