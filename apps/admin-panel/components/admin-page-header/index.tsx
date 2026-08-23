"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface AdminPageHeaderAction {
  label: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  className?: string
}

export interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  count?: number
  countIcon?: React.ComponentType<{ className?: string }>
  action?: AdminPageHeaderAction
  actions?: React.ReactNode
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
  children,
  className,
}: AdminPageHeaderProps) {
  const locale = useLocale()
  const ActionIcon = action?.icon || Plus

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {typeof count === "number" && (
            <Badge
              variant="secondary"
              className={cn(
                "inline-flex items-center gap-1 font-semibold",
                locale === "fa" ? "font-sans" : "font-mono"
              )}
            >
              {CountIcon && <CountIcon className="size-3" />}
              <span>{formatNumber(count, locale)}</span>
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {action && (
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
        )}
        {actions}
        {children}
      </div>
    </div>
  )
}
