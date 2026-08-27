"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FileSpreadsheet, Download, MoreVertical } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { PermissionGuard } from "@/components/permission-guard"

export interface UsersHeaderActionsProps {
  totalCount: number
  onImportClick?: () => void
  onExportClick?: () => void
  isExporting?: boolean
}

export function UsersHeaderActions({
  totalCount,
  onImportClick,
  onExportClick,
  isExporting,
}: UsersHeaderActionsProps) {
  const t = useTranslations("common")
  const hasExtraActions = Boolean(onImportClick || onExportClick)

  if (!hasExtraActions) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
        aria-label={t("navShort.staff")}
      >
        <MoreVertical className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        drawerTitle={t("navShort.staff")}
        className="min-w-44"
      >
        {onImportClick && (
          <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
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
          <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="hide">
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
  )
}
