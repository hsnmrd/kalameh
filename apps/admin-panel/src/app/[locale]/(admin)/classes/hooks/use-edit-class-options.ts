"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import type {
  BranchDto,
  ClassDto,
  ClassroomDto,
  CourseDto,
  TeacherDto,
  TermDto,
} from "@workspace/types"
import {
  branchesResource,
  classesResource,
  classroomsResource,
  coursesResource,
  teachersResource,
  termsResource,
} from "@/lib/api"
import {
  computeLocalScheduleConflicts,
  findClassroomScheduleConflict,
  findTeacherScheduleConflict,
  type ScheduleWindowInput,
} from "../helper/class-resource-conflicts"

const EMPTY_TERMS: TermDto[] = []
const EMPTY_COURSES: CourseDto[] = []
const EMPTY_BRANCHES: BranchDto[] = []
const EMPTY_CLASSROOMS: ClassroomDto[] = []
const EMPTY_TEACHERS: TeacherDto[] = []
const EMPTY_CLASSES: ClassDto[] = []

export interface UseEditClassOptionsParams {
  cls: ClassDto | null
  open: boolean
  effectiveInstituteId: string | null
  selectedTermId?: string | null
  selectedBranchId?: string | null
  selectedClassroomId?: string | null
  selectedTeacherId?: string | null
  selectedTeacherName?: string | null
  scheduleWindow: ScheduleWindowInput
}

export function useEditClassOptions({
  cls,
  open,
  effectiveInstituteId,
  selectedTermId,
  selectedBranchId,
  selectedClassroomId,
  selectedTeacherId,
  selectedTeacherName,
  scheduleWindow,
}: UseEditClassOptionsParams) {
  const t = useTranslations("classes")
  const queryParams = effectiveInstituteId
    ? { instituteId: effectiveInstituteId }
    : undefined

  const { data: terms = EMPTY_TERMS } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && Boolean(effectiveInstituteId),
  })

  const { data: courses = EMPTY_COURSES } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && Boolean(effectiveInstituteId),
  })

  const { data: branches = EMPTY_BRANCHES } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && Boolean(effectiveInstituteId),
  })

  const { data: classrooms = EMPTY_CLASSROOMS } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && Boolean(effectiveInstituteId),
  })

  const { data: teachers = EMPTY_TEACHERS } = useQuery({
    ...teachersResource.list.toQuery({
      ...(effectiveInstituteId ? { instituteId: effectiveInstituteId } : {}),
      isActive: true,
    }),
    enabled: open && Boolean(effectiveInstituteId),
  })

  const effectiveTermId = selectedTermId || cls?.termId || ""
  const { data: termClasses = EMPTY_CLASSES } = useQuery({
    ...classesResource.list.toQuery({
      ...(effectiveInstituteId ? { instituteId: effectiveInstituteId } : {}),
      ...(effectiveTermId ? { termId: effectiveTermId } : {}),
    }),
    enabled: open && Boolean(effectiveInstituteId) && Boolean(effectiveTermId),
  })

  const termOptions = React.useMemo(
    () => terms.map((tm) => ({ value: tm.id, label: tm.title })),
    [terms]
  )

  const courseOptions = React.useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title })),
    [courses]
  )

  const branchOptions = React.useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  )

  const selectedTerm = React.useMemo(
    () => terms.find((tm) => tm.id === (selectedTermId || cls?.termId)),
    [terms, selectedTermId, cls?.termId]
  )

  const selectedTeacher = React.useMemo(
    () =>
      teachers.find(
        (tch) => tch.id === (selectedTeacherId || cls?.teacherId)
      ) || null,
    [teachers, selectedTeacherId, cls?.teacherId]
  )

  const teacherOptions = React.useMemo<ComboboxOption[]>(
    () =>
      teachers.map((tch) => {
        const conflict = findTeacherScheduleConflict(
          tch,
          scheduleWindow,
          termClasses,
          cls?.id
        )
        const isCurrentSelection = tch.id === selectedTeacherId

        if (conflict?.type === "TEACHER_CLASS") {
          return {
            value: tch.id,
            label: `${tch.firstName} ${tch.lastName}`,
            description: t("editModal.teacherBusyWithClass", {
              classTitle: conflict.conflictingClass.title,
              time: `${conflict.conflictingClass.startTime ?? ""} - ${conflict.conflictingClass.endTime ?? ""}`,
            }),
            disabled: !isCurrentSelection,
          }
        }

        if (conflict?.type === "TEACHER_FREE_TIME") {
          return {
            value: tch.id,
            label: `${tch.firstName} ${tch.lastName}`,
            description: t("editModal.teacherOutsideFreeTime"),
            disabled: !isCurrentSelection,
          }
        }

        return {
          value: tch.id,
          label: `${tch.firstName} ${tch.lastName}`,
        }
      }),
    [teachers, scheduleWindow, termClasses, cls?.id, selectedTeacherId, t]
  )

  const filteredClassrooms = React.useMemo(() => {
    if (!selectedBranchId) return classrooms
    return classrooms.filter(
      (r) => !r.branchId || r.branchId === selectedBranchId
    )
  }, [classrooms, selectedBranchId])

  const selectedClassroom = React.useMemo(
    () => classrooms.find((r) => r.id === selectedClassroomId),
    [classrooms, selectedClassroomId]
  )

  const classroomOptions = React.useMemo<ComboboxOption[]>(
    () =>
      filteredClassrooms.map((r) => {
        const conflict = findClassroomScheduleConflict(
          r.id,
          scheduleWindow,
          termClasses,
          cls?.id
        )
        const isCurrentSelection = r.id === selectedClassroomId

        return {
          value: r.id,
          label: `${r.name} (${t("classroomPicker.capacity", { count: r.capacity })})`,
          description: conflict
            ? t("editModal.classroomBusyWithClass", {
                classTitle: conflict.conflictingClass.title,
                time: `${conflict.conflictingClass.startTime ?? ""} - ${conflict.conflictingClass.endTime ?? ""}`,
              })
            : undefined,
          disabled: Boolean(conflict && !isCurrentSelection),
        }
      }),
    [
      filteredClassrooms,
      scheduleWindow,
      termClasses,
      cls?.id,
      selectedClassroomId,
      t,
    ]
  )

  const activeConflictResult = React.useMemo(() => {
    const analysis = computeLocalScheduleConflicts({
      term: selectedTerm,
      termClasses,
      teacher: selectedTeacher,
      teacherId: selectedTeacherId,
      teacherName: selectedTeacherName,
      classroomId: selectedClassroomId,
      startTime: scheduleWindow.startTime,
      endTime: scheduleWindow.endTime,
      daysOfWeek: scheduleWindow.daysOfWeek,
      sessionDates: scheduleWindow.sessionDates,
      excludeClassId: cls?.id,
      formatClassroomConflictMessage: (classTitle) =>
        t("scheduleWizard.conflictClassroomMsg", { classTitle }),
      formatTeacherConflictMessage: (classTitle) =>
        t("scheduleWizard.conflictTeacherMsg", { classTitle }),
      formatTeacherFreeTimeMessage: (teacherName) =>
        t("scheduleWizard.conflictTeacherFreeTimeMsg", { teacherName }),
    })
    return analysis.conflictResult
  }, [
    selectedTerm,
    termClasses,
    selectedTeacher,
    selectedTeacherId,
    selectedTeacherName,
    selectedClassroomId,
    scheduleWindow,
    cls?.id,
    t,
  ])

  return {
    termOptions,
    courseOptions,
    branchOptions,
    classrooms,
    teachers,
    termClasses,
    teacherOptions,
    classroomOptions,
    selectedTerm,
    selectedTeacher,
    selectedClassroom,
    activeConflictResult,
  }
}
