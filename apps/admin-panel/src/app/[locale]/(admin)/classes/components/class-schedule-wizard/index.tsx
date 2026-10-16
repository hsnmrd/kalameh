"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { TimePicker } from "@workspace/ui/components/time-picker"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  toDateKey,
  useClassScheduleState,
} from "../../hooks/use-class-schedule-state"
import { useScheduleWizardConflicts } from "../../hooks/use-schedule-wizard-conflicts"
import { TeacherSchedulePreview } from "../teacher-schedule-preview"
import { SchedulePresetsBar } from "./schedule-presets-bar"
import { ScheduleCalendarPreview } from "./schedule-calendar-preview"
import type { ClassScheduleWizardProps } from "./types"

export type { ClassScheduleValue, ClassScheduleWizardProps } from "./types"

const EMPTY_DAYS: string[] = []

export function ClassScheduleWizard({
  open,
  onClose,
  term,
  termClasses,
  teacher,
  instituteId,
  classroomId,
  teacherId,
  teacherName,
  excludeClassId,
  initialDaysOfWeek = EMPTY_DAYS,
  initialSessionDates = EMPTY_DAYS,
  initialStartTime = "17:00",
  initialEndTime = "18:30",
  onConfirm,
}: ClassScheduleWizardProps) {
  const t = useTranslations("classes.scheduleWizard")
  const clearConflictRef = React.useRef<() => void>(() => {})
  const handleClearConflict = React.useCallback(() => {
    clearConflictRef.current()
  }, [])

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
    onClearConflict: handleClearConflict,
  })

  const {
    sortedDays,
    sortedSessionDates,
    occupiedDateReasons,
    effectiveConflictResult,
    effectiveConflictingDates,
    effectiveConflictMessage,
    clearConflictState,
    isCheckingConflicts,
    validateBeforeConfirm,
  } = useScheduleWizardConflicts({
    term,
    termClasses,
    teacher,
    instituteId,
    classroomId,
    teacherId,
    teacherName,
    excludeClassId,
    selectedDays,
    sessionDateKeys,
    startTime,
    endTime,
  })

  React.useEffect(() => {
    clearConflictRef.current = clearConflictState
  }, [clearConflictState])

  const onCalendarDayClick = React.useCallback(
    (clickedDate: Date) => {
      const key = toDateKey(clickedDate)
      if (!sessionDateKeys.has(key) && occupiedDateReasons.has(key)) {
        toast.error(occupiedDateReasons.get(key)!)
        return
      }
      handleDayClick(clickedDate)
    },
    [sessionDateKeys, occupiedDateReasons, handleDayClick]
  )

  const handleConfirm = async () => {
    const isValid = await validateBeforeConfirm()
    if (!isValid) return

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
          {teacher && <TeacherSchedulePreview teacher={teacher} />}

          <SchedulePresetsBar
            selectedDays={selectedDays}
            onApplyPreset={applyPreset}
            onToggleDay={toggleDay}
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{t("timeRange")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs">{t("startTime")}</FieldLabel>
                <TimePicker
                  value={startTime}
                  onChange={(val) => {
                    setStartTime(val ?? "")
                    clearConflictState()
                  }}
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs">{t("endTime")}</FieldLabel>
                <TimePicker
                  value={endTime}
                  onChange={(val) => {
                    setEndTime(val ?? "")
                    clearConflictState()
                  }}
                />
              </Field>
            </div>
          </div>

          <ScheduleCalendarPreview
            term={term}
            sessionDates={sessionDates}
            conflictingDates={effectiveConflictingDates}
            conflictResult={effectiveConflictResult}
            conflictMessage={effectiveConflictMessage}
            initialMonth={initialMonth}
            onDayClick={onCalendarDayClick}
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
            disabled={sessionDates.length === 0 || isCheckingConflicts}
            className="gap-2"
          >
            {isCheckingConflicts && <Spinner className="size-3.5" />}
            <span>{t("confirm")}</span>
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
