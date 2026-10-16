"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  WEEK_DAYS,
  type ClassConflictResult,
  type ClassDto,
  type TeacherDto,
  type TermDto,
  type WeekDay,
} from "@workspace/types"
import { classesResource } from "@/lib/api"
import { computeLocalScheduleConflicts } from "../helper/class-resource-conflicts"

export interface UseScheduleWizardConflictsParams {
  term?: TermDto | null
  termClasses?: ClassDto[]
  teacher?: TeacherDto | null
  instituteId?: string | null
  classroomId?: string | null
  teacherId?: string | null
  teacherName?: string | null
  excludeClassId?: string | null
  selectedDays: WeekDay[]
  sessionDateKeys: Set<string>
  startTime: string
  endTime: string
}

export function useScheduleWizardConflicts({
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
}: UseScheduleWizardConflictsParams) {
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

  const sortedDays = React.useMemo(
    () => WEEK_DAYS.filter((d) => selectedDays.includes(d)),
    [selectedDays]
  )
  const sortedSessionDates = React.useMemo(
    () => Array.from(sessionDateKeys).sort(),
    [sessionDateKeys]
  )

  const localAnalysis = React.useMemo(
    () =>
      computeLocalScheduleConflicts({
        term,
        termClasses,
        teacher,
        teacherId,
        teacherName,
        classroomId,
        startTime,
        endTime,
        daysOfWeek: sortedDays,
        sessionDates: sortedSessionDates,
        excludeClassId,
        formatClassroomConflictMessage: (classTitle) =>
          t("conflictClassroomMsg", { classTitle }),
        formatTeacherConflictMessage: (classTitle) =>
          t("conflictTeacherMsg", { classTitle }),
        formatTeacherFreeTimeMessage: (name) =>
          t("conflictTeacherFreeTimeMsg", { teacherName: name }),
      }),
    [
      term,
      termClasses,
      teacher,
      teacherId,
      teacherName,
      classroomId,
      startTime,
      endTime,
      sortedDays,
      sortedSessionDates,
      excludeClassId,
      t,
    ]
  )

  const effectiveConflictResult = conflictResult ?? localAnalysis.conflictResult
  const effectiveConflictingDates =
    conflictingDates.length > 0
      ? conflictingDates
      : (localAnalysis.conflictResult?.conflictingDates ?? [])
  const effectiveConflictMessage =
    conflictMessage ??
    localAnalysis.conflictResult?.conflicts[0]?.message ??
    null

  const validateBeforeConfirm = async (): Promise<boolean> => {
    if (localAnalysis.conflictResult?.hasConflict) {
      const firstMsg =
        localAnalysis.conflictResult.conflicts[0]?.message ||
        t("conflictDetected")
      setConflictingDates(localAnalysis.conflictResult.conflictingDates)
      setConflictMessage(firstMsg)
      setConflictResult(localAnalysis.conflictResult)
      toast.error(firstMsg)
      return false
    }

    const effectiveClassroomId =
      classroomId === "NONE" || classroomId === "REMOTE"
        ? null
        : classroomId || null

    if (
      term?.id &&
      (effectiveClassroomId || teacherId || teacherName?.trim()) &&
      startTime &&
      endTime
    ) {
      try {
        const result = await checkConflictsMutation.mutateAsync({
          termId: term.id,
          classroomId: effectiveClassroomId,
          teacherId: teacherId || null,
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
          return false
        }
      } catch {
        return false
      }
    }

    clearConflictState()
    return true
  }

  return {
    sortedDays,
    sortedSessionDates,
    occupiedDateReasons: localAnalysis.occupiedDateReasons,
    effectiveConflictResult,
    effectiveConflictingDates,
    effectiveConflictMessage,
    clearConflictState,
    isCheckingConflicts: checkConflictsMutation.isPending,
    validateBeforeConfirm,
  }
}
