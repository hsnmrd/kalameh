"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PERMISSIONS } from "@workspace/types"
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
        permission: PERMISSIONS.MANAGE_COURSES,
      }}
    />
  )
}
