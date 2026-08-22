"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { SingleStudentGradeInput } from "@workspace/types"
import { gradesResource, classesResource } from "@/lib/api"
import { GradesHeader } from "./components/grades-header"
import { ClassInfoCard } from "./components/class-info-card"
import { GradesTable } from "./components/grades-table"

export default function ClassGradesPage() {
  const t = useTranslations("grades")
  const params = useParams()
  const classId = params.id as string
  const queryClient = useQueryClient()

  const { data: cls } = useQuery(classesResource.detail.toQuery(classId))
  const { data: records, isLoading } = useQuery(
    gradesResource.getClassGrades.toQuery(classId)
  )

  const submitMutation = useMutation({
    ...gradesResource.submitClassGrades.toMutation(),
    onSuccess: () => {
      toast.success(t("success"))
      queryClient.invalidateQueries({
        queryKey: gradesResource.getClassGrades.baseKey(),
      })
    },
  })

  const handleSubmit = (grades: SingleStudentGradeInput[]) => {
    submitMutation.mutate({
      classId,
      body: { grades },
    })
  }

  return (
    <div className="space-y-6">
      <GradesHeader />

      <ClassInfoCard cls={cls} studentsCount={records?.length ?? 0} />

      <GradesTable
        records={records}
        isLoading={isLoading}
        isSubmitting={submitMutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
