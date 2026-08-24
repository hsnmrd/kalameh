"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, RotateCcw, Save } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Badge } from "@workspace/ui/components/badge"
import { PermissionGuard } from "@/components/permission-guard"

export interface RolePermissionsStickyBarProps {
  onSave: () => void
  onReset: () => void
  isSaving: boolean
  isResetting: boolean
  hasChanges: boolean
  selectedPermissionsCount: number
}

export function RolePermissionsStickyBar({
  onSave,
  onReset,
  isSaving,
  isResetting,
  hasChanges,
  selectedPermissionsCount,
}: RolePermissionsStickyBarProps) {
  const t = useTranslations("rolePermissions")

  return (
    <div className="sticky bottom-4 z-30 mt-8">
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur-md sm:flex-row">
        <div className="flex items-center gap-3">
          {hasChanges ? (
            <Badge
              variant="default"
              className="gap-1.5 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20"
            >
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              <span>{t("unsavedChanges")}</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1.5 text-muted-foreground"
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>{t("allSaved")}</span>
            </Badge>
          )}

          <span className="text-xs text-muted-foreground">
            {selectedPermissionsCount} {t("selectedCount")}
          </span>
        </div>

        <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
          <PermissionGuard
            permission={PERMISSIONS.MANAGE_ROLE_PERMISSIONS}
            mode="disable"
          >
            <Button
              variant="outline"
              onClick={onReset}
              disabled={isResetting || isSaving}
              className="h-10 cursor-pointer gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-2xs hover:bg-muted disabled:opacity-50"
            >
              {isResetting ? (
                <Spinner className="size-4" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              <span>{isResetting ? t("resetting") : t("resetToDefaults")}</span>
            </Button>
          </PermissionGuard>

          <PermissionGuard
            permission={PERMISSIONS.MANAGE_ROLE_PERMISSIONS}
            mode="disable"
          >
            <Button
              onClick={onSave}
              disabled={isSaving || isResetting || !hasChanges}
              className="h-10 cursor-pointer gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <Spinner className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              <span>{isSaving ? t("saving") : t("saveChanges")}</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  )
}
