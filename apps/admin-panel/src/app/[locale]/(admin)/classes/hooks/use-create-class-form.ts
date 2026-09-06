"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  classesResource,
  termsResource,
  coursesResource,
  branchesResource,
  classroomsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateClassSchema,
  type CreateClassInput,
} from "./use-class-schemas"

export function useCreateClassForm(open: boolean, onClose: () => void) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createClassSchema = useCreateClassSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })
  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })
  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })
  const { data: classrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
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

  const singleBranchId = branches.length === 1 ? branches[0]?.id || null : null

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      termId: "",
      courseId: "",
      branchId: singleBranchId,
      classroomId: null,
      capacity: 15,
      fee: 1500000,
      teacherName: "",
      schedule: "",
      daysOfWeek: [],
      sessionDates: [],
      startTime: null,
      endTime: null,
    },
  })

  const { watch, setValue, reset } = form

  const hasAutoSelectedBranchRef = React.useRef(false)
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
        label: `${r.name} (${r.capacity} ${t("createModal.capacity") || "نفر"})`,
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

  // Clear classroom if branch changed and room belongs to another branch
  React.useEffect(() => {
    if (selectedClassroomId && selectedBranchId) {
      const room = classrooms.find((r) => r.id === selectedClassroomId)
      if (room && room.branchId && room.branchId !== selectedBranchId) {
        setValue("classroomId", null)
      }
    }
  }, [selectedBranchId, selectedClassroomId, classrooms, setValue])

  // Update fee when course changes
  const selectedCourseId = watch("courseId")
  React.useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      const selected = courses.find((c) => c.id === selectedCourseId)
      if (selected) {
        setValue("fee", selected.baseFee)
      }
    }
  }, [selectedCourseId, courses, setValue])

  // Auto-set first term
  const hasSetDefaultTermRef = React.useRef(false)
  React.useEffect(() => {
    if (
      open &&
      terms.length > 0 &&
      !selectedTermId &&
      !hasSetDefaultTermRef.current
    ) {
      setValue("termId", terms[0]?.id || "")
      hasSetDefaultTermRef.current = true
    }
  }, [open, terms, selectedTermId, setValue])

  // Auto-set first course
  const hasSetDefaultCourseRef = React.useRef(false)
  React.useEffect(() => {
    if (
      open &&
      courses.length > 0 &&
      !selectedCourseId &&
      !hasSetDefaultCourseRef.current
    ) {
      setValue("courseId", courses[0]?.id || "")
      if (courses[0]?.baseFee) {
        setValue("fee", courses[0].baseFee)
      }
      hasSetDefaultCourseRef.current = true
    }
  }, [open, courses, selectedCourseId, setValue])

  // Auto-set single branch
  React.useEffect(() => {
    if (open && singleBranchId && !hasAutoSelectedBranchRef.current) {
      setValue("branchId", singleBranchId)
      hasAutoSelectedBranchRef.current = true
    }
  }, [open, singleBranchId, setValue])

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      if (singleBranchId) {
        hasAutoSelectedBranchRef.current = true
      }
      reset({
        title: "",
        termId: terms[0]?.id || "",
        courseId: courses[0]?.id || "",
        branchId: singleBranchId,
        classroomId: null,
        capacity: 15,
        fee: courses[0]?.baseFee || 1500000,
        teacherName: "",
        schedule: "",
        daysOfWeek: [],
        sessionDates: [],
        startTime: null,
        endTime: null,
      })
    } else {
      hasAutoSelectedBranchRef.current = false
      hasSetDefaultTermRef.current = false
      hasSetDefaultCourseRef.current = false
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...classesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: CreateClassInput) => {
    createMutation.mutate({
      ...values,
      classroomId:
        values.classroomId === "NONE" ? null : values.classroomId || null,
      instituteId: activeInstituteId || undefined,
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
    createMutation,
    onSubmit,
  }
}
