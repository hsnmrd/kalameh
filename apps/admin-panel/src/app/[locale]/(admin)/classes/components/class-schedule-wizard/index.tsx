"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { classesResource } from "@/lib/api"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  WEEK_DAYS,
  type TermDto,
  type ClassConflictResult,
} from "@workspace/types"
import { useClassScheduleState } from "../../hooks/use-class-schedule-state"
import { SchedulePresetsBar } from "./schedule-presets-bar"
import { ScheduleCalendarPreview } from "./schedule-calendar-preview"

export interface ClassScheduleWizardProps {
  open: boolean
  onClose: () => void
  term?: TermDto | null
  instituteId?: string | null
  classroomId?: string | null
  teacherName?: string | null
  excludeClassId?: string | null
  initialDaysOfWeek?: string[]
  initialSessionDates?: string[]
  initialStartTime?: string | null
  initialEndTime?: string | null
  onConfirm: (data: {
    daysOfWeek: string[]
    sessionDates: string[]
    startTime: string | null
    endTime: string | null
    formattedSchedule: string
  }) => void
}

const EMPTY_DAYS: string[] = []

export function ClassScheduleWizard({
  open,
  onClose,
  term,
  instituteId,
  classroomId,
  teacherName,
  excludeClassId,
  initialDaysOfWeek = EMPTY_DAYS,
  initialSessionDates = EMPTY_DAYS,
  initialStartTime = "17:00",
  initialEndTime = "18:30",
  onConfirm,
}: ClassScheduleWizardProps) {
  const t = useTranslations("classes.scheduleWizard")

  const [conflictingDates, setConflictingDates] = React.useState<string[]>([])
  const [conflictMessage, setConflictMessage] = React.useState<string | null>(
    null
  )
  const [conflictResult, setConflictResult] =
    React.useState<ClassConflictResult | null>(null)

  const clearConflictState = React.useCallback(() => {
    setConflictingDates([])
    setConflictMessage(null)
    setConflictResult(null)
  }, [])

  const checkConflictsMutation = useMutation({
    ...classesResource.checkConflicts.toMutation(),
  })

  const {
    selectedDays,
    sessionDateKeys,
    sessionDates,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    initialMonth,
    toggleDay,
    applyPreset,
    handleDayClick,
    isDateDisabled,
  } = useClassScheduleState({
    open,
    term,
    initialDaysOfWeek,
    initialSessionDates,
    initialStartTime,
    initialEndTime,
    onClearConflict: clearConflictState,
  })

  const handleConfirm = async () => {
    const sortedDays = WEEK_DAYS.filter((d) => selectedDays.includes(d))
    const sortedSessionDates = Array.from(sessionDateKeys).sort()

    const effectiveClassroomId =
      classroomId === "NONE" || classroomId === "REMOTE"
        ? null
        : classroomId || null

    if (
      term?.id &&
      (effectiveClassroomId || teacherName?.trim()) &&
      startTime &&
      endTime
    ) {
      try {
        const result = await checkConflictsMutation.mutateAsync({
          termId: term.id,
          classroomId: effectiveClassroomId,
          teacherName: teacherName?.trim() || null,
          startTime,
          endTime,
          daysOfWeek: sortedDays,
          sessionDates: sortedSessionDates,
          excludeClassId: excludeClassId || null,
          instituteId: instituteId || term.instituteId || undefined,
        })
        if (result.hasConflict) {
          setConflictingDates(result.conflictingDates)
          const firstMsg = result.conflicts[0]?.message || t("conflictDetected")
          setConflictMessage(firstMsg)
          setConflictResult(result)
          toast.error(firstMsg)
          return
        }
      } catch {
        return
      }
    }

    clearConflictState()
    const dayNames = sortedDays.map((d) => t(`days.${d}` as any)).join("، ")
    let formattedSchedule = dayNames
    if (sortedDays.length > 0 && startTime && endTime) {
      formattedSchedule = `${dayNames} (${startTime} - ${endTime})`
    } else if (sortedDays.length > 0 && startTime) {
      formattedSchedule = `${dayNames} (${startTime})`
    }

    onConfirm({
      daysOfWeek: sortedDays,
      sessionDates: sortedSessionDates,
      startTime: startTime || null,
      endTime: endTime || null,
      formattedSchedule,
    })
    onClose()
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <SchedulePresetsBar
            selectedDays={selectedDays}
            onApplyPreset={applyPreset}
            onToggleDay={toggleDay}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{t("timeRange")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs">{t("startTime")}</FieldLabel>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    clearConflictState()
                  }}
                  className="text-center"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">{t("endTime")}</FieldLabel>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    clearConflictState()
                  }}
                  className="text-center"
                />
              </Field>
            </div>
          </div>

          <ScheduleCalendarPreview
            term={term}
            sessionDates={sessionDates}
            conflictingDates={conflictingDates}
            conflictResult={conflictResult}
            conflictMessage={conflictMessage}
            initialMonth={initialMonth}
            onDayClick={handleDayClick}
            isDateDisabled={isDateDisabled}
          />
        </div>

        <FormDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={
              sessionDates.length === 0 || checkConflictsMutation.isPending
            }
            className="gap-2"
          >
            {checkConflictsMutation.isPending && (
              <Spinner className="size-3.5" />
            )}
            <span>{t("confirm")}</span>
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
