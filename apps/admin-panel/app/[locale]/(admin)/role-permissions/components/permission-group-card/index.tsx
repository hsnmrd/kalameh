"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { PermissionModule } from "@workspace/types"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface PermissionGroupCardProps {
  module: PermissionModule
  selectedPermissions: Set<string>
  onTogglePermission: (permission: string) => void
  onToggleAllInModule: (permissions: string[], selectAll: boolean) => void
  disabled?: boolean
}

export function PermissionGroupCard({
  module,
  selectedPermissions,
  onTogglePermission,
  onToggleAllInModule,
  disabled = false,
}: PermissionGroupCardProps) {
  const t = useTranslations("rolePermissions")

  const modulePermissions = React.useMemo(
    () => module.permissions.map((p) => p.permission),
    [module]
  )

  const activeCount = React.useMemo(
    () => modulePermissions.filter((p) => selectedPermissions.has(p)).length,
    [modulePermissions, selectedPermissions]
  )

  const allSelected = activeCount === modulePermissions.length

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-card-foreground">
            {t(`modules.${module.id}` as any)}
          </h3>
          <Badge
            variant={activeCount > 0 ? "default" : "secondary"}
            className="text-xs"
          >
            {activeCount} / {modulePermissions.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || allSelected}
            onClick={() => onToggleAllInModule(modulePermissions, true)}
            className="h-7 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            {t("selectAll")}
          </Button>
          <span className="text-muted-foreground/40">•</span>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || activeCount === 0}
            onClick={() => onToggleAllInModule(modulePermissions, false)}
            className="h-7 cursor-pointer text-xs text-muted-foreground hover:text-foreground"
          >
            {t("deselectAll")}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {module.permissions.map(({ permission }) => {
          const isChecked = selectedPermissions.has(permission)

          return (
            <label
              key={permission}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                isChecked
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-background/50 hover:bg-muted/40",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onTogglePermission(permission)}
                disabled={disabled}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {t(`permissions.${permission}` as any)}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {permission}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
