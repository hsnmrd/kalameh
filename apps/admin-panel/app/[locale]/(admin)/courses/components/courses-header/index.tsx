"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface CoursesHeaderProps {
  onAddCourse: () => void
}

export function CoursesHeader({ onAddCourse }: CoursesHeaderProps) {
  const t = useTranslations("courses")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      action={{
        label: t("addCourse"),
        onClick: onAddCourse,
      }}
    />
  )
}
