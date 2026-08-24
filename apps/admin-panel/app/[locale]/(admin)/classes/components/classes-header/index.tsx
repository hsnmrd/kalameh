"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PERMISSIONS } from "@workspace/types"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface ClassesHeaderProps {
  onAddClass: () => void
}

export function ClassesHeader({ onAddClass }: ClassesHeaderProps) {
  const t = useTranslations("classes")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      action={{
        label: t("addClass"),
        onClick: onAddClass,
        permission: PERMISSIONS.MANAGE_CLASSES,
      }}
    />
  )
}
