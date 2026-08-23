"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  CONFIGURABLE_ROLES,
  type Role,
  type RolePermissionResponse,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface RoleSelectorProps {
  selectedRole: Role
  onSelectRole: (role: Role) => void
  rolePermissionsList?: RolePermissionResponse[]
}

export function RoleSelector({
  selectedRole,
  onSelectRole,
  rolePermissionsList = [],
}: RoleSelectorProps) {
  const t = useTranslations("rolePermissions")

  const overriddenMap = React.useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of rolePermissionsList) {
      map.set(item.role, item.isOverridden)
    }
    return map
  }, [rolePermissionsList])

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
      {CONFIGURABLE_ROLES.map((role) => {
        const isSelected = selectedRole === role
        const isOverridden = overriddenMap.get(role) ?? false

        return (
          <Button
            key={role}
            variant={isSelected ? "default" : "secondary"}
            onClick={() => onSelectRole(role)}
            className={cn(
              "cursor-pointer gap-2 rounded-xl text-sm font-medium transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{t(`roles.${role}` as any)}</span>
            {isOverridden && (
              <span
                className={cn(
                  "size-2 rounded-full",
                  isSelected ? "bg-primary-foreground" : "bg-amber-500"
                )}
                title={t("isCustomized")}
              />
            )}
          </Button>
        )
      })}
    </div>
  )
}
