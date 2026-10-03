"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarRange, MapPin } from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
  WeekDay,
} from "@workspace/types"
import { Separator } from "@workspace/ui/components/separator"
import { cn, formatDate } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarView } from "../../scheduling-plan-calendar-view"
import type { CurrentAssignmentState } from "../../scheduling-new-teacher-hiring-plan"
import { SchedulingPlanPublicationStatus } from "../../scheduling-plan-publication-status"
import { SchedulingPlanValidationResult } from "../../scheduling-plan-validation-result"

interface ContentProps {
  plan: SchedulingPlanDetailsDto
  isSelected: boolean
  validationResult: SchedulingPlanValidation | undefined
  stickyTop?: "page" | "dialog"
  className?: string
  selectedTeacherId?: string | null
  onTeacherChange?: (teacherId: string | null) => void
}

function buildDefaultAssignments(
  hiringPlan: SchedulingPlanDetailsDto["newTeacherHiringPlan"]
): Record<string, CurrentAssignmentState> {
  if (!hiringPlan) return {}
  const initial: Record<string, CurrentAssignmentState> = {}
  for (const a of hiringPlan.assignments) {
    initial[a.key] = {
      daysOfWeek: a.daysOfWeek as WeekDay[],
      startTime: a.startTime,
      endTime: a.endTime,
      classroomId: a.classroom?.id ?? null,
      classroomName: a.classroom?.name ?? null,
      isAssigned: true,
    }
  }
  return initial
}

export function Content({
  plan,
  isSelected,
  validationResult,
  stickyTop = "dialog",
  className,
  selectedTeacherId,
  onTeacherChange,
}: ContentProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const [assignmentOverrides, setAssignmentOverrides] = React.useState<{
    planId: string
    state: Record<string, CurrentAssignmentState>
  }>({
    planId: plan.id,
    state: buildDefaultAssignments(plan.newTeacherHiringPlan),
  })

  if (assignmentOverrides.planId !== plan.id) {
    setAssignmentOverrides({
      planId: plan.id,
      state: buildDefaultAssignments(plan.newTeacherHiringPlan),
    })
  }

  const assignmentsState = React.useMemo(() => {
    const currentState =
      assignmentOverrides.planId === plan.id
        ? assignmentOverrides.state
        : buildDefaultAssignments(plan.newTeacherHiringPlan)
    return {
      ...buildDefaultAssignments(plan.newTeacherHiringPlan),
      ...currentState,
    }
  }, [plan.id, plan.newTeacherHiringPlan, assignmentOverrides])

  const setAssignmentsState = React.useCallback(
    (
      updater:
        | Record<string, CurrentAssignmentState>
        | ((
            prev: Record<string, CurrentAssignmentState>
          ) => Record<string, CurrentAssignmentState>)
    ) => {
      setAssignmentOverrides((prev) => {
        const currentState =
          prev.planId === plan.id
            ? prev.state
            : buildDefaultAssignments(plan.newTeacherHiringPlan)
        const nextState =
          typeof updater === "function" ? updater(currentState) : updater
        return { planId: plan.id, state: nextState }
      })
    },
    [plan.id, plan.newTeacherHiringPlan]
  )

  const handleAssignMissedClass = React.useCallback(
    (assignmentKey: string, slotKey: string) => {
      if (!plan.newTeacherHiringPlan?.availableTimeSlots) return

      const matchingOption = plan.newTeacherHiringPlan.availableTimeSlots.find(
        (opt) =>
          `${opt.daysOfWeek.join(",")}|${opt.startTime}|${opt.endTime}` ===
          slotKey
      )

      if (!matchingOption) return

      const targetAssignment = plan.newTeacherHiringPlan.assignments.find(
        (item) => item.key === assignmentKey
      )

      setAssignmentsState((prev) => {
        const takenRoomIds = new Set<string>()
        for (const proposal of plan.proposals) {
          if (
            proposal.classroom?.id &&
            proposal.daysOfWeek.some((day) =>
              matchingOption.daysOfWeek.includes(day as WeekDay)
            ) &&
            proposal.startTime < matchingOption.endTime &&
            matchingOption.startTime < proposal.endTime
          ) {
            takenRoomIds.add(proposal.classroom.id)
          }
        }
        for (const [key, state] of Object.entries(prev)) {
          if (key === assignmentKey) continue
          if (state.isAssigned === false || !state.daysOfWeek.length) continue
          const overlapsDay = state.daysOfWeek.some((day) =>
            matchingOption.daysOfWeek.includes(day)
          )
          const overlapsTime =
            state.startTime < matchingOption.endTime &&
            matchingOption.startTime < state.endTime
          if (overlapsDay && overlapsTime && state.classroomId) {
            takenRoomIds.add(state.classroomId)
          }
        }

        const freeRoom = matchingOption.availableClassrooms.find(
          (room) => !takenRoomIds.has(room.id)
        )
        if (targetAssignment?.deliveryMode === "IN_PERSON" && !freeRoom) {
          return prev
        }

        return {
          ...prev,
          [assignmentKey]: {
            daysOfWeek: matchingOption.daysOfWeek as WeekDay[],
            startTime: matchingOption.startTime,
            endTime: matchingOption.endTime,
            classroomId:
              targetAssignment?.deliveryMode === "ONLINE"
                ? null
                : (freeRoom?.id ?? null),
            classroomName:
              targetAssignment?.deliveryMode === "ONLINE"
                ? null
                : (freeRoom?.name ?? null),
            isAssigned: true,
          },
        }
      })
    },
    [plan.newTeacherHiringPlan, plan.proposals, setAssignmentsState]
  )

  const handleUnassignMissedClass = React.useCallback(
    (assignmentKey: string) => {
      setAssignmentsState((prev) => {
        const existing = prev[assignmentKey]
        if (!existing) return prev
        return {
          ...prev,
          [assignmentKey]: {
            ...existing,
            isAssigned: false,
            daysOfWeek: [],
            startTime: "",
            endTime: "",
            classroomId: null,
            classroomName: null,
          },
        }
      })
    },
    [setAssignmentsState]
  )

  const handleUpdateMissedClassesAssignments = React.useCallback(
    (updates: Record<string, CurrentAssignmentState>) => {
      setAssignmentsState((prev) => ({
        ...prev,
        ...updates,
      }))
    },
    [setAssignmentsState]
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        stickyTop === "dialog"
          ? "overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 lg:min-h-0 lg:flex-1"
          : "w-full",
        className
      )}
    >
      {stickyTop === "dialog" && (
        <dl className="grid gap-4 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">{t("term")}</dt>
            <dd className="mt-1 flex items-center gap-2 font-semibold text-foreground">
              <CalendarRange aria-hidden className="size-4" />
              {plan.run.term.title}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("branch")}</dt>
            <dd className="mt-1 flex items-center gap-2 font-semibold text-foreground">
              <MapPin aria-hidden className="size-4" />
              {plan.run.branch?.name ?? t("allBranches")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("generatedAt")}
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {formatDate(plan.generatedAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("qualityIndex")}
            </dt>
            <dd className="mt-1 font-semibold text-foreground">
              {plan.qualityIndex == null
                ? "—"
                : new Intl.NumberFormat(locale, {
                    style: "percent",
                    maximumFractionDigits: 2,
                  }).format(plan.qualityIndex / 100)}
            </dd>
          </div>
        </dl>
      )}
      {plan.status === "PUBLISHED" && (
        <SchedulingPlanPublicationStatus plan={plan} />
      )}
      {plan.status === "SELECTED" && validationResult && (
        <SchedulingPlanValidationResult
          result={validationResult}
          proposals={plan.proposals}
        />
      )}
      {stickyTop === "dialog" && <Separator />}
      <section aria-label={t("proposalsTitle")}>
        <SchedulingPlanCalendarView
          proposals={plan.proposals}
          canEdit={isSelected && plan.status === "SELECTED"}
          canSwap={plan.status === "DRAFT" || plan.status === "SELECTED"}
          hiringPlan={plan.newTeacherHiringPlan}
          missedClassesAssignments={assignmentsState}
          onAssignMissedClass={handleAssignMissedClass}
          onUnassignMissedClass={handleUnassignMissedClass}
          onUpdateMissedClassesAssignments={
            handleUpdateMissedClassesAssignments
          }
          teacherCalendars={plan.teacherCalendars}
          unresolvedRequirements={plan.unresolvedRequirements}
          planId={plan.id}
          planStatus={plan.status}
          stickyTop={stickyTop}
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={onTeacherChange}
        />
      </section>
    </div>
  )
}
