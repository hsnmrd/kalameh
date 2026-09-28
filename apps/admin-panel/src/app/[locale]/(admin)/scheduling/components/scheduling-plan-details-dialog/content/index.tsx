"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  CircleAlert,
  ListChecks,
  MapPin,
} from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { formatDate, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarView } from "../../scheduling-plan-calendar-view"
import {
  SchedulingNewTeacherHiringPlan,
  type CurrentAssignmentState,
} from "../../scheduling-new-teacher-hiring-plan"
import { SchedulingPlanPublicationStatus } from "../../scheduling-plan-publication-status"
import { SchedulingPlanValidationResult } from "../../scheduling-plan-validation-result"
import { SchedulingPlanUnfilledTeachers } from "../../scheduling-plan-unfilled-teachers"
import { SchedulingProposalDetailsItem } from "../../scheduling-proposal-details-item"
import { SchedulingUnresolvedRequirementItem } from "../../scheduling-unresolved-requirement-item"
import { SchedulingWarningList } from "../../scheduling-warning-list"

interface ContentProps {
  plan: SchedulingPlanDetailsDto
  isSelected: boolean
  validationResult: SchedulingPlanValidation | undefined
}

export function Content({ plan, isSelected, validationResult }: ContentProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">(
    "calendar"
  )
  const missingClassCount = plan.unresolvedRequirements.reduce(
    (sum, requirement) => sum + requirement.missingClassCount,
    0
  )

  const [assignmentsState, setAssignmentsState] = React.useState<
    Record<string, CurrentAssignmentState>
  >(() => {
    if (!plan.newTeacherHiringPlan) return {}
    const initial: Record<string, CurrentAssignmentState> = {}
    for (const a of plan.newTeacherHiringPlan.assignments) {
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
  })

  React.useEffect(() => {
    if (!plan.newTeacherHiringPlan) {
      setAssignmentsState({})
      return
    }
    const next: Record<string, CurrentAssignmentState> = {}
    for (const a of plan.newTeacherHiringPlan.assignments) {
      next[a.key] = {
        daysOfWeek: a.daysOfWeek as WeekDay[],
        startTime: a.startTime,
        endTime: a.endTime,
        classroomId: a.classroom?.id ?? null,
        classroomName: a.classroom?.name ?? null,
        isAssigned: true,
      }
    }
    setAssignmentsState(next)
  }, [plan.newTeacherHiringPlan])

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
    [plan.newTeacherHiringPlan, plan.proposals]
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
    []
  )

  const handleResetAssignments = React.useCallback(() => {
    if (!plan.newTeacherHiringPlan) return
    const next: Record<string, CurrentAssignmentState> = {}
    for (const a of plan.newTeacherHiringPlan.assignments) {
      next[a.key] = {
        daysOfWeek: a.daysOfWeek as WeekDay[],
        startTime: a.startTime,
        endTime: a.endTime,
        classroomId: a.classroom?.id ?? null,
        classroomName: a.classroom?.name ?? null,
        isAssigned: true,
      }
    }
    setAssignmentsState(next)
  }, [plan.newTeacherHiringPlan])

  return (
    <div className="flex flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5 lg:min-h-0 lg:flex-1">
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
          <dt className="text-xs text-muted-foreground">{t("generatedAt")}</dt>
          <dd className="mt-1 font-semibold text-foreground">
            {formatDate(plan.generatedAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("qualityIndex")}</dt>
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
      {plan.status === "PUBLISHED" && (
        <SchedulingPlanPublicationStatus plan={plan} />
      )}
      {plan.status === "SELECTED" && validationResult && (
        <SchedulingPlanValidationResult
          result={validationResult}
          proposals={plan.proposals}
        />
      )}
      {plan.warnings.length > 0 && (
        <section aria-labelledby="plan-warnings-title">
          <h3 id="plan-warnings-title" className="font-bold text-foreground">
            {t("planWarnings")}
          </h3>
          <div className="mt-3">
            <SchedulingWarningList
              warnings={plan.warnings}
              ariaLabel={t("planWarnings")}
            />
          </div>
        </section>
      )}
      <Separator />
      <section aria-labelledby="plan-proposals-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3
              id="plan-proposals-title"
              className="flex items-center gap-2 font-bold text-foreground"
            >
              <ListChecks aria-hidden className="size-5" />
              {t("proposalsTitle")}
            </h3>
            <Badge variant="secondary">
              {t("proposalCount", {
                count: formatNumber(plan.proposals.length, locale),
              })}
            </Badge>
          </div>
          <div
            role="radiogroup"
            aria-label={t("proposalsTitle")}
            className="flex items-center rounded-xl border border-border bg-muted/50 p-1"
          >
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-pressed={viewMode === "calendar"}
            >
              <CalendarDays aria-hidden className="size-3.5" />
              <span>{t("calendarView.toggleCalendar")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-pressed={viewMode === "list"}
            >
              <ListChecks aria-hidden className="size-3.5" />
              <span>{t("calendarView.toggleList")}</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {viewMode === "calendar" ? (
            <SchedulingPlanCalendarView
              proposals={plan.proposals}
              canEdit={isSelected && plan.status === "SELECTED"}
              hiringPlan={plan.newTeacherHiringPlan}
              missedClassesAssignments={assignmentsState}
              onAssignMissedClass={handleAssignMissedClass}
              onUnassignMissedClass={handleUnassignMissedClass}
            />
          ) : plan.proposals.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {plan.proposals.map((proposal) => (
                <SchedulingProposalDetailsItem
                  key={proposal.id}
                  proposal={proposal}
                  canEdit={isSelected && plan.status === "SELECTED"}
                />
              ))}
            </ul>
          ) : (
            <Empty variant="compact" className="mt-4 bg-muted/30">
              <EmptyMedia>
                <BookOpenCheck aria-hidden />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("noProposals.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("noProposals.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
      <Separator />
      <SchedulingPlanUnfilledTeachers calendars={plan.teacherCalendars ?? []} />
      {plan.unresolvedRequirements.length > 0 && (
        <section aria-labelledby="plan-unresolved-title">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="plan-unresolved-title"
              className="flex items-center gap-2 font-bold text-foreground"
            >
              <CircleAlert aria-hidden className="size-5" />
              {t("unresolvedTitle")}
            </h3>
            <Badge variant="warning">
              {t("missingCount", {
                count: formatNumber(missingClassCount, locale),
              })}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {t("unresolvedDescription")}
          </p>
          <SchedulingNewTeacherHiringPlan
            plan={plan.newTeacherHiringPlan}
            missingClassCount={missingClassCount}
            planId={plan.id}
            planStatus={plan.status}
            assignmentsState={assignmentsState}
            onResetAssignments={handleResetAssignments}
          />
          <ul className="mt-4 flex flex-col gap-3">
            {plan.unresolvedRequirements.map((requirement) => (
              <SchedulingUnresolvedRequirementItem
                key={requirement.id}
                requirement={requirement}
                newTeacherHiringPlan={plan.newTeacherHiringPlan}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
