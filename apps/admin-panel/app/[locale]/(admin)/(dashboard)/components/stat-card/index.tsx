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
  iconBgClassName = "bg-slate-100",
  iconColorClassName = "text-slate-700",
  badgeText,
  badgeVariant = "neutral",
}: StatCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-slate-300">
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
                "border border-emerald-200 bg-emerald-50 text-emerald-700",
              badgeVariant === "neutral" &&
                "border border-slate-200 bg-slate-50 text-slate-600",
              badgeVariant === "info" &&
                "border border-blue-200 bg-blue-50 text-blue-700"
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  )
}
