"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AdminPageHeader } from "@/components/admin-page-header"

export function RolePermissionsHeader() {
  const t = useTranslations("rolePermissions")

  return <AdminPageHeader title={t("title")} subtitle={t("description")} />
}
