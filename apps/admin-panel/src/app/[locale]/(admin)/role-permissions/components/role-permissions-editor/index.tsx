"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  PERMISSION_MODULES,
  type Role,
  type RolePermissionResponse,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { RoleSelector } from "../role-selector"
import { PermissionGroupCard } from "../permission-group-card"

export interface RolePermissionsEditorProps {
  selectedRole: Role
  onSelectRole: (role: Role) => void
  rolePermissionsList?: RolePermissionResponse[]
  currentRoleData?: RolePermissionResponse
  selectedPermissions: Set<string>
  onTogglePermission: (permission: string) => void
  onToggleAllInModule: (permissions: string[], selectAll: boolean) => void
  disabled?: boolean
}

export function RolePermissionsEditor({
  selectedRole,
  onSelectRole,
  rolePermissionsList,
  currentRoleData,
  selectedPermissions,
  onTogglePermission,
  onToggleAllInModule,
  disabled = false,
}: RolePermissionsEditorProps) {
  const t = useTranslations("rolePermissions")

  return (
    <div className="space-y-6">
      <RoleSelector
        selectedRole={selectedRole}
        onSelectRole={onSelectRole}
        rolePermissionsList={rolePermissionsList}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {t(`roles.${selectedRole}` as any)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("roleDescription")}
          </p>
        </div>

        <div>
          {currentRoleData?.isOverridden ? (
            <Badge
              variant="default"
              className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20"
            >
              {t("isCustomized")}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("isDefault")}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {PERMISSION_MODULES.map((module) => (
          <PermissionGroupCard
            key={module.id}
            module={module}
            selectedPermissions={selectedPermissions}
            onTogglePermission={onTogglePermission}
            onToggleAllInModule={onToggleAllInModule}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
