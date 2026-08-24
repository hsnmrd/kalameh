"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface UsersHeaderProps {
  totalCount: number
  onAddUserClick: () => void
}

export function UsersHeader({ totalCount, onAddUserClick }: UsersHeaderProps) {
  const t = useTranslations("users")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      count={totalCount}
      countIcon={Users}
      action={{
        label: t("addUser"),
        onClick: onAddUserClick,
        permission: PERMISSIONS.MANAGE_USERS,
      }}
    />
  )
}
