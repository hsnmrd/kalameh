"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  branchesResource,
  classroomsResource,
  coursesResource,
  teachersResource,
  termsResource,
} from "@/lib/api"

export function useCreateClassOptions(
  open: boolean,
  activeInstituteId: string | null | undefined
) {
  const t = useTranslations("classes")
  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: classrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: teachers = [] } = useQuery({
    ...teachersResource.list.toQuery({
      ...(activeInstituteId ? { instituteId: activeInstituteId } : {}),
      isActive: true,
    }),
    enabled: open && Boolean(activeInstituteId),
  })

  const termOptions = React.useMemo(
    () => terms.map((term) => ({ value: term.id, label: term.title })),
    [terms]
  )
  const courseOptions = React.useMemo(
    () => courses.map((course) => ({ value: course.id, label: course.title })),
    [courses]
  )
  const branchOptions = React.useMemo(
    () => branches.map((branch) => ({ value: branch.id, label: branch.name })),
    [branches]
  )
  const teacherOptions = React.useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher.id,
        label: `${teacher.firstName} ${teacher.lastName}`,
      })),
    [teachers]
  )
  const singleBranchId = branches.length === 1 ? branches[0]?.id || null : null

  return {
    t,
    terms,
    courses,
    classrooms,
    teachers,
    termOptions,
    courseOptions,
    branchOptions,
    teacherOptions,
    singleBranchId,
  }
}
