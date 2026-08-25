"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, FileSpreadsheet } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { AdminPageHeader } from "@/components/admin-page-header"
import { PermissionGuard } from "@/components/permission-guard"

export interface UsersHeaderProps {
  totalCount: number
  onAddUserClick: () => void
  onImportClick?: () => void
}

export function UsersHeader({
  totalCount,
  onAddUserClick,
  onImportClick,
}: UsersHeaderProps) {
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
      actions={
        onImportClick && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="disable">
            <Button
              variant="outline"
              onClick={onImportClick}
              className="h-10 cursor-pointer gap-2 rounded-xl border-border px-4 text-sm font-medium hover:bg-muted"
            >
              <FileSpreadsheet className="size-4 text-foreground" />
              <span>{t("importModal.trigger")}</span>
            </Button>
          </PermissionGuard>
        )
      }
    />
  )
}
