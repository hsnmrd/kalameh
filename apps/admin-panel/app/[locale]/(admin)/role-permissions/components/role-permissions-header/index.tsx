"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { RotateCcw, Save } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface RolePermissionsHeaderProps {
  onSave: () => void
  onReset: () => void
  isSaving: boolean
  isResetting: boolean
  hasChanges: boolean
}

export function RolePermissionsHeader({
  onSave,
  onReset,
  isSaving,
  isResetting,
  hasChanges,
}: RolePermissionsHeaderProps) {
  const t = useTranslations("rolePermissions")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("description")}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={isResetting || isSaving}
            className="cursor-pointer gap-2 rounded-xl"
          >
            {isResetting ? (
              <Spinner className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            <span>{isResetting ? t("resetting") : t("resetToDefaults")}</span>
          </Button>

          <Button
            onClick={onSave}
            disabled={isSaving || isResetting || !hasChanges}
            className="cursor-pointer gap-2 rounded-xl bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            {isSaving ? (
              <Spinner className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{isSaving ? t("saving") : t("saveChanges")}</span>
          </Button>
        </div>
      }
    />
  )
}
