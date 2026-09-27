"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  CalendarClock,
  CalendarX2,
  DoorOpen,
  GraduationCap,
  ListChecks,
} from "lucide-react"
import type { SchedulingNewTeacherHiringPlan as HiringPlan } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingNewTeacherHiringPlanProps {
  plan: HiringPlan | null
  missingClassCount: number
}

export function SchedulingNewTeacherHiringPlan({
  plan,
  missingClassCount,
}: SchedulingNewTeacherHiringPlanProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const days = plan
    ? plan.daysOfWeek.map((day) => t(`weekDays.${day}`)).join(t("daySeparator"))
    : ""
  const requiresRoomResolution =
    plan?.assignments.some(
      ({ deliveryMode, classroom }) =>
        deliveryMode === "IN_PERSON" && classroom === null
    ) ?? false

  return (
    <section
      aria-labelledby="new-teacher-hiring-plan-title"
      className="mt-4 rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <GraduationCap
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-foreground"
          />
          <div>
            <h4
              id="new-teacher-hiring-plan-title"
              className="text-sm font-bold text-foreground"
            >
              {t("hiringPlan.title")}
            </h4>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {t("hiringPlan.description")}
            </p>
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
                  {days} · {plan.startTime}–{plan.endTime}
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

          <div className="mt-4 flex items-center gap-2">
            <ListChecks
              aria-hidden
              className="size-4 shrink-0 text-foreground"
            />
            <p className="text-xs font-semibold text-foreground">
              {t("hiringPlan.sequenceTitle")}
            </p>
            <Badge
              variant={
                plan.usesPreferredThreeDayPattern ? "success" : "warning"
              }
            >
              {t(
                plan.usesPreferredThreeDayPattern
                  ? "hiringPlan.preferredThreeDay"
                  : "hiringPlan.alternateDays"
              )}
            </Badge>
            <Badge variant={plan.hasConsecutiveTimes ? "success" : "warning"}>
              {t(
                plan.hasConsecutiveTimes
                  ? "hiringPlan.consecutive"
                  : "hiringPlan.spacedTimes"
              )}
            </Badge>
          </div>

          <ol className="mt-2.5 divide-y divide-border overflow-hidden rounded-lg bg-background">
            {plan.assignments.map((assignment, index) => {
              const needsRoom =
                assignment.deliveryMode === "IN_PERSON" &&
                assignment.classroom === null
              const assignmentDays = assignment.daysOfWeek
                .map((day) => t(`weekDays.${day}`))
                .join(t("daySeparator"))

              return (
                <li
                  key={assignment.key}
                  className="grid gap-2 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {formatNumber(index + 1, locale)}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {assignmentDays} · {assignment.startTime}–
                      {assignment.endTime}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {t("hiringPlan.courseClass", {
                      course: assignment.course.title,
                      number: formatNumber(assignment.classNumber, locale),
                    })}
                  </p>
                  <div
                    className={
                      needsRoom
                        ? "flex items-center gap-1.5 text-xs text-warning-foreground"
                        : "flex items-center gap-1.5 text-xs text-muted-foreground"
                    }
                  >
                    <DoorOpen aria-hidden className="size-4 shrink-0" />
                    <span>
                      {assignment.deliveryMode === "ONLINE"
                        ? t("hiringPlan.online")
                        : needsRoom
                          ? t("hiringPlan.roomNeeded")
                          : t("hiringPlan.room", {
                              room: assignment.classroom?.name ?? "",
                            })}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {t(
              requiresRoomResolution
                ? "hiringPlan.validationWithRoomChanges"
                : "hiringPlan.validation"
            )}
          </p>
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
