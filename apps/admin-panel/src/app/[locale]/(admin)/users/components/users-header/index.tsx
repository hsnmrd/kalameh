"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, FileSpreadsheet, Download } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageHeader } from "@/components/admin-page-header"
import { PermissionGuard } from "@/components/permission-guard"

export interface UsersHeaderProps {
  totalCount: number
  onAddUserClick: () => void
  onImportClick?: () => void
  onExportClick?: () => void
  isExporting?: boolean
}

export function UsersHeader({
  totalCount,
  onAddUserClick,
  onImportClick,
  onExportClick,
  isExporting,
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
        <div className="flex items-center gap-2">
          {onExportClick && (
            <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="disable">
              <Button
                variant="outline"
                onClick={onExportClick}
                disabled={isExporting || totalCount === 0}
                className="h-10 cursor-pointer gap-2 rounded-xl border-border px-3.5 text-sm font-medium hover:bg-muted"
              >
                {isExporting ? (
                  <Spinner className="size-4 text-foreground" />
                ) : (
                  <Download className="size-4 text-foreground" />
                )}
                <span>{t("export.trigger")}</span>
              </Button>
            </PermissionGuard>
          )}

          {onImportClick && (
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_USERS}
              mode="disable"
            >
              <Button
                variant="outline"
                onClick={onImportClick}
                className="h-10 cursor-pointer gap-2 rounded-xl border-border px-3.5 text-sm font-medium hover:bg-muted"
              >
                <FileSpreadsheet className="size-4 text-foreground" />
                <span>{t("importModal.trigger")}</span>
              </Button>
            </PermissionGuard>
          )}
        </div>
      }
    />
  )
}
