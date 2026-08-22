"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GraduationCap } from "lucide-react"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface StudentsHeaderProps {
  totalCount: number
  onAddStudentClick: () => void
}

export function StudentsHeader({
  totalCount,
  onAddStudentClick,
}: StudentsHeaderProps) {
  const t = useTranslations("students")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      count={totalCount}
      countIcon={GraduationCap}
      action={{
        label: t("addStudent"),
        onClick: onAddStudentClick,
      }}
    />
  )
}
