"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarX2 } from "lucide-react"
import type {
  SchedulingStaffingFallback as StaffingFallbackDto,
  SchedulingTeacherOutreachOption,
  WeekDay,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { useActiveInstitute } from "@/lib/stores"
import type { NewTeacherAssignment } from "../scheduling-new-teacher-assignment-list"
import { OutreachCarousel } from "./outreach-carousel"
import { RequiredScheduleCard } from "./required-schedule-card"

interface SchedulingStaffingFallbackProps {
  branchNumber?: number
  fallback: StaffingFallbackDto
  targetCourseTitle: string
  hiringAssignments: NewTeacherAssignment[]
  planId?: string
  planStatus?: string
  unresolvedRequirementId?: string
  unavailableTeachers?: Array<{
    id: string
    firstName: string
    lastName: string
    phoneNumber?: string | null
    avatarUrl?: string | null
  }>
  currentSchedule?: {
    daysOfWeek: WeekDay[]
    startTime: string
    endTime: string
  } | null
}

export function SchedulingStaffingFallback({
  branchNumber,
  fallback,
  targetCourseTitle,
  hiringAssignments,
  planId,
  planStatus,
  unresolvedRequirementId,
  unavailableTeachers,
  currentSchedule,
}: SchedulingStaffingFallbackProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [pendingOption, setPendingOption] = React.useState<{
    key: string
    action: "ACCEPT" | "REJECT"
  } | null>(null)

  const effectiveCurrentSchedule = React.useMemo(() => {
    if (
      currentSchedule?.daysOfWeek?.length &&
      currentSchedule.startTime &&
      currentSchedule.endTime
    ) {
      return currentSchedule
    }
    const firstAssignment = hiringAssignments[0]
    if (
      firstAssignment?.daysOfWeek?.length &&
      firstAssignment.startTime &&
      firstAssignment.endTime
    ) {
      return {
        daysOfWeek: firstAssignment.daysOfWeek,
        startTime: firstAssignment.startTime,
        endTime: firstAssignment.endTime,
      }
    }
    return null
  }, [currentSchedule, hiringAssignments])

  const mergedOptions = React.useMemo<SchedulingTeacherOutreachOption[]>(() => {
    const existing = [...fallback.availabilityOptions]
    const existingTeacherIds = new Set(existing.map((opt) => opt.teacher.id))

    if (!unavailableTeachers || unavailableTeachers.length === 0) {
      return existing
    }

    const defaultSchedule = effectiveCurrentSchedule ?? {
      daysOfWeek: [],
      startTime: "",
      endTime: "",
    }

    const bankOptions: SchedulingTeacherOutreachOption[] = []
    for (const bt of unavailableTeachers) {
      if (existingTeacherIds.has(bt.id)) continue

      bankOptions.push({
        key: `bank-${bt.id}`,
        teacher: {
          id: bt.id,
          firstName: bt.firstName,
          lastName: bt.lastName,
          phoneNumber: bt.phoneNumber ?? null,
          avatarUrl: bt.avatarUrl ?? null,
        },
        deliveryMode: hiringAssignments[0]?.deliveryMode ?? "IN_PERSON",
        daysOfWeek: defaultSchedule.daysOfWeek,
        startTime: defaultSchedule.startTime,
        endTime: defaultSchedule.endTime,
        availabilityChangeDays: defaultSchedule.daysOfWeek,
        availableClassrooms: hiringAssignments[0]?.classroom
          ? [hiringAssignments[0].classroom]
          : [],
        isAccepted: false,
        isRejected: false,
      })
    }

    return [...existing, ...bankOptions]
  }, [
    fallback.availabilityOptions,
    unavailableTeachers,
    effectiveCurrentSchedule,
    hiringAssignments,
  ])

  const canToggle =
    Boolean(planId) &&
    Boolean(unresolvedRequirementId) &&
    (!planStatus || ["DRAFT", "SELECTED"].includes(planStatus))

  const toggleMutation = useMutation({
    ...schedulingResource.toggleTeacherOutreach.toMutation(),
    onSuccess: (updatedPlan, variables) => {
      const targetOption = mergedOptions.find(
        (opt) => opt.key === variables.body.optionKey
      )
      const action = variables.body.action ?? "ACCEPT"
      if (action === "REJECT") {
        const wasRejected = Boolean(targetOption?.isRejected)
        toast.success(
          t(
            wasRejected
              ? "staffingFallback.revertRejectSuccess"
              : "staffingFallback.rejectSuccess"
          )
        )
      } else {
        const wasAccepted = Boolean(targetOption?.isAccepted)
        toast.success(
          t(
            wasAccepted
              ? "staffingFallback.revertSuccess"
              : "staffingFallback.acceptSuccess"
          )
        )
      }
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
      setPendingOption(null)
    },
  })

  const handleToggleOption = (
    option: SchedulingTeacherOutreachOption,
    action: "ACCEPT" | "REJECT"
  ) => {
    if (!planId || !unresolvedRequirementId || toggleMutation.isPending) return
    setPendingOption({ key: option.key, action })
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
        action,
      },
    })
  }

  if (mergedOptions.length > 0) {
    return (
      <section
        aria-label={t("staffingFallback.title")}
        className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-colors sm:p-5"
      >
        <OutreachCarousel
          branchNumber={branchNumber}
          options={mergedOptions}
          canToggle={canToggle}
          isPending={(key) =>
            toggleMutation.isPending && pendingOption?.key === key
          }
          pendingAction={pendingOption?.action ?? null}
          currentSchedule={effectiveCurrentSchedule}
          onToggle={handleToggleOption}
        />
      </section>
    )
  }

  return (
    <section aria-label={t("staffingFallback.title")}>
      <div className="flex items-start gap-2 border-y border-border py-3">
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

      <RequiredScheduleCard assignments={hiringAssignments} />
    </section>
  )
}
