"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  iconBgClassName?: string
  iconColorClassName?: string
  badgeText?: string
  badgeVariant?: "success" | "neutral" | "info"
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgClassName = "bg-muted",
  iconColorClassName = "text-foreground",
  badgeText,
  badgeVariant = "neutral",
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs transition-all hover:border-border/80">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            iconBgClassName,
            iconColorClassName
          )}
        >
          <Icon className="size-5" />
        </div>
        {badgeText && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              badgeVariant === "success" &&
                "border border-success/20 bg-success/10 text-success",
              badgeVariant === "neutral" &&
                "border border-border bg-muted text-muted-foreground",
              badgeVariant === "info" &&
                "border border-primary/20 bg-primary/10 text-primary"
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
