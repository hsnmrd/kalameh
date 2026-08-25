"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FileSpreadsheet, Download, MoreVertical } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { AdminPageHeader } from "@/components/admin-page-header"
import { PermissionGuard } from "@/components/permission-guard"

export interface UsersHeaderProps {
  totalCount: number
  onAddUserClick: () => void
  onImportClick?: () => void
  onExportClick?: () => void
  isExporting?: boolean
  onMobileMenuClick?: () => void
}

export function UsersHeader({
  totalCount,
  onAddUserClick,
  onImportClick,
  onExportClick,
  isExporting,
  onMobileMenuClick,
}: UsersHeaderProps) {
  const t = useTranslations("users")
  const hasExtraActions = Boolean(onImportClick || onExportClick)

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      action={{
        label: t("addUser"),
        onClick: onAddUserClick,
        permission: PERMISSIONS.MANAGE_USERS,
      }}
      mobileActions={
        hasExtraActions && onMobileMenuClick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMobileMenuClick}
            aria-label={t("title")}
            className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="size-5" />
          </Button>
        ) : undefined
      }
      actions={
        hasExtraActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
              aria-label={t("title")}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {onImportClick && (
                <PermissionGuard
                  permission={PERMISSIONS.MANAGE_USERS}
                  mode="hide"
                >
                  <DropdownMenuItem
                    onClick={onImportClick}
                    className="flex cursor-pointer items-center gap-2 text-foreground"
                  >
                    <FileSpreadsheet className="size-4 text-foreground" />
                    <span>{t("importModal.trigger")}</span>
                  </DropdownMenuItem>
                </PermissionGuard>
              )}

              {onExportClick && (
                <PermissionGuard
                  permission={PERMISSIONS.VIEW_USERS}
                  mode="hide"
                >
                  <DropdownMenuItem
                    onClick={onExportClick}
                    disabled={isExporting || totalCount === 0}
                    className="flex cursor-pointer items-center gap-2 text-foreground"
                  >
                    {isExporting ? (
                      <Spinner className="size-4 text-foreground" />
                    ) : (
                      <Download className="size-4 text-foreground" />
                    )}
                    <span>{t("export.trigger")}</span>
                  </DropdownMenuItem>
                </PermissionGuard>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : undefined
      }
    />
  )
}
