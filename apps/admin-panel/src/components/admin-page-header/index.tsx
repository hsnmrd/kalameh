"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { Plus, SlidersHorizontal } from "lucide-react"
import type { Permission } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { PermissionGuard, type PermissionGuardMode } from "../permission-guard"

export interface AdminPageHeaderAction {
  label: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  className?: string
  permission?: Permission | readonly Permission[]
  permissionMode?: PermissionGuardMode
}

export interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  count?: number
  countIcon?: React.ComponentType<{ className?: string }>
  action?: AdminPageHeaderAction
  actions?: React.ReactNode
  mobileActions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  subtitle,
  count,
  countIcon: CountIcon,
  action,
  actions,
  mobileActions,
  children,
  className,
}: AdminPageHeaderProps) {
  const locale = useLocale()
  const ActionIcon = action?.icon || Plus

  const renderActionButton = () => {
    if (!action) return null

    const button = (
      <Button
        onClick={action.onClick}
        disabled={action.disabled}
        className={cn(
          "h-10 cursor-pointer gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90",
          action.className
        )}
      >
        <ActionIcon className="size-4" />
        <span>{action.label}</span>
      </Button>
    )

    if (action.permission) {
      return (
        <PermissionGuard
          permission={action.permission}
          mode={action.permissionMode ?? "disable"}
        >
          {button}
        </PermissionGuard>
      )
    }

    return button
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Mobile actions at end of title row (e.g. three-dot icon button) */}
        {mobileActions && (
          <div className="flex shrink-0 items-center lg:hidden">
            {mobileActions}
          </div>
        )}
      </div>

      {/* Desktop action buttons — hidden on mobile (FAB handles mobile) */}
      <div className="hidden items-center gap-2.5 lg:flex">
        {renderActionButton()}
        {actions}
        {children}
      </div>
    </div>
  )
}

/**
 * AdminPageHeaderFilterButton — a compact filter icon button shown next
 * to the search input on mobile. Renders nothing on desktop (lg+).
 * Passes the click through to open a Drawer filter sheet.
 */
export interface AdminPageHeaderFilterButtonProps {
  onClick: () => void
  active?: boolean
  "aria-label": string
  className?: string
}

export function AdminPageHeaderFilterButton({
  onClick,
  active,
  "aria-label": ariaLabel,
  className,
}: AdminPageHeaderFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "h-10 w-10 shrink-0 rounded-xl border-border lg:hidden",
        active && "border-primary text-primary",
        className
      )}
    >
      <SlidersHorizontal className="size-4" />
    </Button>
  )
}
