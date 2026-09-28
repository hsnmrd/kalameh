"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, Check, DoorOpen, GraduationCap } from "lucide-react"
import type {
  SchedulingNewTeacherHiringAssignment,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface TargetSlotInfo {
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  availableClassroomName?: string | null
  availableRoomsCount: number
}

export interface CurrentAssignmentState {
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  classroomId: string | null
  classroomName: string | null
  isAssigned?: boolean
}

export interface AssignSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetSlot: TargetSlotInfo | null
  assignments: SchedulingNewTeacherHiringAssignment[]
  assignmentsState: Record<string, CurrentAssignmentState>
  onSelectAssignment: (assignmentKey: string) => void
}

export function AssignSlotDialog({
  open,
  onOpenChange,
  targetSlot,
  assignments,
  assignmentsState,
  onSelectAssignment,
}: AssignSlotDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  if (!targetSlot) return null

  const daysLabel = targetSlot.daysOfWeek
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))

  const targetSlotKey = `${targetSlot.daysOfWeek.join(",")}|${targetSlot.startTime}|${targetSlot.endTime}`

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center justify-between gap-2">
            <ResponsiveDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <CalendarClock aria-hidden className="size-5 text-primary" />
              <span>{t("calendarView.assignSlotTitle")}</span>
            </ResponsiveDialogTitle>
            <ResponsiveDialogCloseButton />
          </div>
          <ResponsiveDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("calendarView.assignSlotDescription", {
              days: daysLabel,
              start: targetSlot.startTime,
              end: targetSlot.endTime,
            })}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <CalendarClock
              aria-hidden
              className="size-4 text-muted-foreground"
            />
            <span>
              {daysLabel} · {targetSlot.startTime}–{targetSlot.endTime}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DoorOpen aria-hidden className="size-3.5" />
            <span>
              {targetSlot.availableClassroomName
                ? t("hiringPlan.roomOption", {
                    room: targetSlot.availableClassroomName,
                  })
                : t("calendarView.availableRooms", {
                    count: targetSlot.availableRoomsCount,
                  })}
            </span>
          </div>
        </div>

        <div className="mt-4 flex max-h-80 flex-col gap-2.5 overflow-y-auto pr-1">
          {assignments.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t("calendarView.noMissedClassesToAssign")}
            </p>
          ) : (
            assignments.map((assignment, index) => {
              const current = assignmentsState[assignment.key]
              const currentSlotKey = current
                ? `${current.daysOfWeek.join(",")}|${current.startTime}|${current.endTime}`
                : ""
              const isAlreadyInThisSlot = currentSlotKey === targetSlotKey

              const currentDaysText = current
                ? current.daysOfWeek
                    .map((d) => t(`weekDays.${d}`))
                    .join(t("daySeparator"))
                : ""

              return (
                <div
                  key={assignment.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs transition-colors hover:border-primary/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Badge variant="outline" className="shrink-0">
                      {formatNumber(index + 1, locale)}
                    </Badge>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground">
                        {t("hiringPlan.courseClass", {
                          course: assignment.course.title,
                          number: formatNumber(assignment.classNumber, locale),
                        })}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {isAlreadyInThisSlot ? (
                          <span className="font-medium text-primary">
                            {t("calendarView.assignedInCalendar")}
                          </span>
                        ) : current ? (
                          <span>
                            {currentDaysText} · {current.startTime}–
                            {current.endTime}
                          </span>
                        ) : (
                          <span>{t("calendarView.unassignedInCalendar")}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={isAlreadyInThisSlot ? "secondary" : "default"}
                    disabled={isAlreadyInThisSlot}
                    onClick={() => {
                      onSelectAssignment(assignment.key)
                      onOpenChange(false)
                    }}
                    className="h-10 shrink-0 gap-1 rounded-xl px-3 text-xs"
                  >
                    {isAlreadyInThisSlot ? (
                      <>
                        <Check aria-hidden className="size-3.5 text-primary" />
                        <span>{t("calendarView.assignedInCalendar")}</span>
                      </>
                    ) : (
                      <span>{t("calendarView.assignClass")}</span>
                    )}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
