"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { ClassDto } from "@workspace/types"
import { classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { formatClassScheduleString } from "../helper/class-resource-conflicts"
import {
  useUpdateClassSchema,
  type UpdateClassInput,
} from "./use-class-schemas"
import { useEditClassOptions } from "./use-edit-class-options"

export function useEditClassForm(
  cls: ClassDto | null,
  open: boolean,
  onClose: () => void
) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateClassSchema = useUpdateClassSchema()
  const effectiveInstituteId = activeInstituteId || cls?.instituteId || null

  const form = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      title: "",
      termId: "",
      courseId: "",
      branchId: null,
      classroomId: null,
      capacity: 15,
      fee: 0,
      teacherId: null,
      teacherName: "",
      schedule: "",
      daysOfWeek: [],
      sessionDates: [],
      startTime: null,
      endTime: null,
    },
  })

  const { control, reset, setValue } = form

  const selectedTermId = useWatch({ control, name: "termId" })
  const selectedBranchId = useWatch({ control, name: "branchId" })
  const selectedClassroomId = useWatch({ control, name: "classroomId" })
  const selectedTeacherId = useWatch({ control, name: "teacherId" })
  const selectedTeacherName = useWatch({ control, name: "teacherName" })
  const watchedDaysOfWeek = useWatch({ control, name: "daysOfWeek" })
  const watchedSessionDates = useWatch({ control, name: "sessionDates" })
  const watchedStartTime = useWatch({ control, name: "startTime" })
  const watchedEndTime = useWatch({ control, name: "endTime" })

  const scheduleWindow = React.useMemo(
    () => ({
      daysOfWeek: watchedDaysOfWeek,
      sessionDates: watchedSessionDates,
      startTime: watchedStartTime,
      endTime: watchedEndTime,
    }),
    [watchedDaysOfWeek, watchedSessionDates, watchedStartTime, watchedEndTime]
  )

  const {
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
  } = useEditClassOptions({
    cls,
    open,
    effectiveInstituteId,
    selectedTermId,
    selectedBranchId,
    selectedClassroomId,
    selectedTeacherId,
    selectedTeacherName,
    scheduleWindow,
  })

  const classCapacity = useWatch({ control, name: "capacity" }) || 0
  const isCapacityExceeded = Boolean(
    selectedClassroom && classCapacity > selectedClassroom.capacity
  )

  // Clear classroom if branch changed and room doesn't match
  React.useEffect(() => {
    if (selectedClassroomId && selectedBranchId) {
      const room = classrooms.find((r) => r.id === selectedClassroomId)
      if (room && room.branchId && room.branchId !== selectedBranchId) {
        setValue("classroomId", null)
      }
    }
  }, [selectedBranchId, selectedClassroomId, classrooms, setValue])

  const tRef = React.useRef(t)
  tRef.current = t

  // Populate form with class data
  React.useEffect(() => {
    if (cls) {
      const formattedSchedule = formatClassScheduleString(cls, (day) =>
        tRef.current(`scheduleWizard.days.${day}` as any)
      )
      reset({
        title: cls.title,
        termId: cls.termId,
        courseId: cls.courseId,
        branchId: cls.branchId || null,
        classroomId: cls.classroomId || null,
        capacity: cls.capacity,
        fee: cls.fee,
        teacherId: cls.teacherId || null,
        teacherName: cls.teacherName || "",
        schedule: formattedSchedule,
        daysOfWeek: cls.daysOfWeek || [],
        sessionDates: cls.sessionDates || [],
        startTime: cls.startTime || null,
        endTime: cls.endTime || null,
      })
    }
  }, [cls, reset])

  const updateMutation = useMutation({
    ...classesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateClassInput) => {
    if (!cls) return
    if (activeConflictResult?.hasConflict) {
      const firstMsg =
        activeConflictResult.conflicts[0]?.message ||
        t("scheduleWizard.conflictDetected")
      toast.error(firstMsg)
      return
    }
    updateMutation.mutate({
      id: cls.id,
      body: {
        ...values,
        classroomId:
          values.classroomId === "NONE" ? null : values.classroomId || null,
      },
    })
  }

  return {
    form,
    activeInstituteId,
    termOptions,
    courseOptions,
    branchOptions,
    teacherOptions,
    teachers,
    classroomOptions,
    termClasses,
    activeConflictResult,
    selectedTerm,
    selectedTeacher,
    selectedClassroom,
    classCapacity,
    isCapacityExceeded,
    updateMutation,
    onSubmit,
  }
}
