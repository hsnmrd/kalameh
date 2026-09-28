"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  GraduationCap,
  Info,
  ListChecks,
  RotateCcw,
} from "lucide-react"
import type {
  CommitHiringPlanInput,
  SchedulingNewTeacherHiringPlan as HiringPlan,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { formatNumber } from "@workspace/ui/lib/utils"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { ClassesCarousel } from "./classes-carousel"

export interface CurrentAssignmentState {
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  classroomId: string | null
  classroomName: string | null
  isAssigned?: boolean
}

export interface SchedulingNewTeacherHiringPlanProps {
  plan: HiringPlan | null
  missingClassCount: number
  planId?: string
  planStatus?: string
  assignmentsState?: Record<string, CurrentAssignmentState>
  onResetAssignments?: () => void
}

const EVEN_DAYS: WeekDay[] = ["SUNDAY", "TUESDAY", "THURSDAY"]
const ODD_DAYS: WeekDay[] = ["SATURDAY", "MONDAY", "WEDNESDAY"]

export function SchedulingNewTeacherHiringPlan({
  plan,
  missingClassCount,
  planId,
  planStatus,
  assignmentsState: assignmentsStateProp,
  onResetAssignments,
}: SchedulingNewTeacherHiringPlanProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const queryClient = useQueryClient()

  const defaultAssignments = React.useMemo(() => {
    if (!plan) return {}
    const initial: Record<string, CurrentAssignmentState> = {}
    for (const a of plan.assignments) {
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
  }, [plan])

  const [customAssignmentsState] = React.useState<Record<
    string,
    CurrentAssignmentState
  > | null>(null)

  const activeAssignmentsState =
    assignmentsStateProp ?? customAssignmentsState ?? defaultAssignments

  const commitMutation = useMutation({
    ...schedulingResource.commitHiringPlan.toMutation(),
    onSuccess: () => {
      toast.success(t("hiringPlan.commitSuccess"))
      queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.baseKey(),
      })
    },
  })

  const isEditable =
    Boolean(planId) &&
    (!planStatus || ["DRAFT", "SELECTED"].includes(planStatus))

  const handleCommit = () => {
    if (!planId || !plan) return

    const unassignedCount = plan.assignments.filter((orig) => {
      const current = activeAssignmentsState[orig.key]
      return (
        !current ||
        current.isAssigned === false ||
        !current.daysOfWeek.length ||
        !current.startTime ||
        !current.endTime
      )
    }).length

    if (unassignedCount > 0) {
      toast.error(t("calendarView.unassignedInCalendar"))
      return
    }

    const payload: CommitHiringPlanInput = {
      assignments: plan.assignments.map((orig) => {
        const current = activeAssignmentsState[orig.key] ?? {
          daysOfWeek: orig.daysOfWeek as WeekDay[],
          startTime: orig.startTime,
          endTime: orig.endTime,
          classroomId: orig.classroom?.id ?? null,
        }
        return {
          key: orig.key,
          classNumber: orig.classNumber,
          requirementId: orig.requirementId,
          courseId: orig.course.id,
          deliveryMode: orig.deliveryMode,
          daysOfWeek: current.daysOfWeek,
          startTime: current.startTime,
          endTime: current.endTime,
          classroomId: current.classroomId,
        }
      }),
    }

    commitMutation.mutate({
      planId,
      body: payload,
    })
  }

  // Dynamic calculations across chosen assignments
  const selectedEntries = Object.values(activeAssignmentsState).filter(
    (entry) => entry.isAssigned !== false && entry.daysOfWeek.length > 0
  )
  const allDays = Array.from(
    new Set(selectedEntries.flatMap((entry) => entry.daysOfWeek))
  )
  allDays.sort((left, right) => {
    const order: WeekDay[] = [
      "SATURDAY",
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ]
    return order.indexOf(left) - order.indexOf(right)
  })

  const daysLabel = allDays
    .map((d) => t(`weekDays.${d}`))
    .join(t("daySeparator"))
  const startTimes = selectedEntries.map((e) => e.startTime).sort()
  const endTimes = selectedEntries.map((e) => e.endTime).sort()
  const overallStartTime = startTimes[0] ?? plan?.startTime ?? ""
  const overallEndTime = endTimes[endTimes.length - 1] ?? plan?.endTime ?? ""

  const usesPreferredThreeDay =
    allDays.length === 3 &&
    (allDays.every((d) => EVEN_DAYS.includes(d)) ||
      allDays.every((d) => ODD_DAYS.includes(d)))

  const hasConsecutive = React.useMemo(() => {
    if (selectedEntries.length <= 1) return true
    const sorted = [...selectedEntries].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i]!.endTime !== sorted[i + 1]!.startTime) {
        return false
      }
    }
    return true
  }, [selectedEntries])

  const requiresRoomResolution = selectedEntries.some(
    (entry) => entry.classroomId === null
  )

  return (
    <section
      aria-labelledby="new-teacher-hiring-plan-title"
      className="mt-4 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <GraduationCap
            aria-hidden
            className="size-5 shrink-0 text-foreground"
          />
          <div className="flex items-center gap-1.5">
            <h4
              id="new-teacher-hiring-plan-title"
              className="text-sm font-bold text-foreground"
            >
              {t("hiringPlan.title")}
            </h4>
            <Tooltip delay={200}>
              <TooltipTrigger
                type="button"
                aria-label={t("hiringPlan.infoTooltipLabel")}
                className="inline-flex size-5 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden"
              >
                <Info aria-hidden className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-5">
                {t("hiringPlan.description")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Badge variant="secondary">
          {t("hiringPlan.classCount", {
            count: formatNumber(
              plan?.totalClassCount ?? missingClassCount,
              locale
            ),
          })}
        </Badge>
      </div>

      {plan ? (
        <>
          <dl className="mt-4 grid border-y border-border sm:grid-cols-2">
            <div className="flex items-start gap-2 border-b border-border py-3 sm:border-e sm:border-b-0 sm:px-3">
              <CalendarClock
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("hiringPlan.requiredAvailability")}
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-foreground">
                  {daysLabel || t("hiringPlan.noRoomAssigned")} ·{" "}
                  {overallStartTime}–{overallEndTime}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2 py-3 sm:px-3">
              <GraduationCap
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              />
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("hiringPlan.requiredQualifications")}
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {plan.requiredCourses.map((course) => (
                    <Badge key={course.id} variant="outline">
                      {course.title}
                    </Badge>
                  ))}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ListChecks
              aria-hidden
              className="size-4 shrink-0 text-foreground"
            />
            <p className="text-xs font-semibold text-foreground">
              {t("hiringPlan.sequenceTitle")}
            </p>
            <Badge variant={usesPreferredThreeDay ? "success" : "warning"}>
              {t(
                usesPreferredThreeDay
                  ? "hiringPlan.preferredThreeDay"
                  : "hiringPlan.alternateDays"
              )}
            </Badge>
            <Badge variant={hasConsecutive ? "success" : "warning"}>
              {t(
                hasConsecutive
                  ? "hiringPlan.consecutive"
                  : "hiringPlan.spacedTimes"
              )}
            </Badge>
          </div>

          <ClassesCarousel
            assignments={plan.assignments}
            activeAssignmentsState={activeAssignmentsState}
          />

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t(
              requiresRoomResolution
                ? "hiringPlan.validationWithRoomChanges"
                : "hiringPlan.validation"
            )}
          </p>

          {isEditable && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {onResetAssignments ? (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={onResetAssignments}
                  disabled={commitMutation.isPending}
                >
                  <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
                  <span>{t("hiringPlan.resetSuggestion")}</span>
                </Button>
              ) : (
                <div />
              )}
              <Button
                size="default"
                disabled={commitMutation.isPending}
                onClick={handleCommit}
                className="w-full sm:w-auto"
              >
                {commitMutation.isPending ? (
                  <>
                    <Spinner className="size-4 shrink-0" />
                    <span>{t("hiringPlan.committing")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{t("hiringPlan.commitButton")}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 flex items-start gap-2 border-y border-border py-4">
          <CalendarX2
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t("hiringPlan.emptyTitle")}
            </p>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {t("hiringPlan.emptyDescription")}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
