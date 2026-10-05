"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarX2, PhoneCall, UserPlus } from "lucide-react"
import type {
  SchedulingStaffingFallback as StaffingFallbackDto,
  SchedulingTeacherOutreachOption,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "@workspace/ui/components/sonner"
import { formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { useActiveInstitute } from "@/lib/stores"
import type { NewTeacherAssignment } from "../scheduling-new-teacher-assignment-list"
import { OutreachCarousel } from "./outreach-carousel"

interface SchedulingStaffingFallbackProps {
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
    avatarUrl?: string | null
  }>
}

export function SchedulingStaffingFallback({
  fallback,
  targetCourseTitle,
  hiringAssignments,
  planId,
  planStatus,
  unresolvedRequirementId,
  unavailableTeachers,
}: SchedulingStaffingFallbackProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [pendingOption, setPendingOption] = React.useState<{
    key: string
    action: "ACCEPT" | "REJECT"
  } | null>(null)

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

  return (
    <section
      aria-label={t("staffingFallback.title")}
      className="rounded-xl border border-border p-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus aria-hidden className="size-4 shrink-0 text-foreground" />
          <h5 className="text-xs font-semibold text-foreground">
            {t("staffingFallback.title")}
          </h5>
        </div>
        {fallback.availabilityOptions.length > 0 && (
          <Badge variant="secondary" className="text-xs font-medium">
            {t("staffingFallback.solutionsCount", {
              count: formatNumber(fallback.availabilityOptions.length, locale),
            })}
          </Badge>
        )}
      </div>

      {fallback.availabilityOptions.length > 0 ? (
        <div className="mt-3">
          <OutreachCarousel
            options={fallback.availabilityOptions}
            canToggle={canToggle}
            isPending={(key) =>
              toggleMutation.isPending && pendingOption?.key === key
            }
            pendingAction={pendingOption?.action ?? null}
            onToggle={handleToggleOption}
          />
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

      <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
        <div className="flex items-start gap-2.5">
          <PhoneCall
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {t("staffingFallback.teacherBankBadge")}
              </Badge>
              <p className="text-xs font-semibold text-foreground">
                {t("staffingFallback.teacherBankTitle")}
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("staffingFallback.teacherBankDescription")}
            </p>

            {/* Unavailable Bank Teachers */}
            {unavailableTeachers && unavailableTeachers.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {unavailableTeachers.map((teacher) => {
                  const teacherName =
                    `${teacher.firstName} ${teacher.lastName}`.trim()
                  return (
                    <div
                      key={teacher.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 shadow-2xs"
                    >
                      <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                        {teacher.avatarUrl ? (
                          <Image
                            src={getAssetUrl(teacher.avatarUrl)}
                            alt={teacherName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {teacher.firstName[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {teacherName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-muted-foreground"
                      >
                        {t("staffingFallback.callTeacherBadge")}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Needed time slot if available */}
        {hiringAssignments.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-2.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("staffingFallback.neededSlotNotice")}:
            </span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {hiringAssignments.map((a) => {
                const days = a.daysOfWeek
                  .map((day) => t(`weekDays.${day}`))
                  .join(t("daySeparator"))
                return (
                  <Badge key={a.key} variant="outline" className="text-xs">
                    {days} · {a.startTime}–{a.endTime}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
