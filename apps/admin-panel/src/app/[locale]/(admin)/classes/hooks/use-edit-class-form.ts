"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { ClassDto } from "@workspace/types"
import {
  classesResource,
  termsResource,
  coursesResource,
  branchesResource,
  classroomsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateClassSchema,
  type UpdateClassInput,
} from "./use-class-schemas"

export function useEditClassForm(
  cls: ClassDto | null,
  open: boolean,
  onClose: () => void
) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateClassSchema = useUpdateClassSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })

  const termOptions = React.useMemo(
    () => terms.map((tm) => ({ value: tm.id, label: tm.title })),
    [terms]
  )

  const { data: courseOptions = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (courses) => courses.map((c) => ({ value: c.id, label: c.title })),
  })

  const { data: branchOptions = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (branches) => branches.map((b) => ({ value: b.id, label: b.name })),
  })

  const { data: classrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })

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
      teacherName: "",
      schedule: "",
      daysOfWeek: [],
      sessionDates: [],
      startTime: null,
      endTime: null,
    },
  })

  const { reset, watch, setValue } = form

  const selectedTermId = watch("termId")
  const selectedTerm = React.useMemo(
    () => terms.find((tm) => tm.id === selectedTermId),
    [terms, selectedTermId]
  )

  const selectedBranchId = watch("branchId")
  const filteredClassrooms = React.useMemo(() => {
    if (!selectedBranchId) return classrooms
    return classrooms.filter(
      (r) => !r.branchId || r.branchId === selectedBranchId
    )
  }, [classrooms, selectedBranchId])

  const classroomOptions = React.useMemo(
    () =>
      filteredClassrooms.map((r) => ({
        value: r.id,
        label: `${r.name} (${r.capacity} ${t("editModal.capacity") || "نفر"})`,
      })),
    [filteredClassrooms, t]
  )

  const selectedClassroomId = watch("classroomId")
  const selectedClassroom = React.useMemo(
    () => classrooms.find((r) => r.id === selectedClassroomId),
    [classrooms, selectedClassroomId]
  )
  const classCapacity = watch("capacity") || 0
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

  // Populate form with class data
  React.useEffect(() => {
    if (cls) {
      reset({
        title: cls.title,
        termId: cls.termId,
        courseId: cls.courseId,
        branchId: cls.branchId || null,
        classroomId: cls.classroomId || null,
        capacity: cls.capacity,
        fee: cls.fee,
        teacherName: cls.teacherName || "",
        schedule: cls.schedule || "",
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
    classroomOptions,
    selectedTerm,
    selectedClassroom,
    classCapacity,
    isCapacityExceeded,
    updateMutation,
    onSubmit,
  }
}
