"use client"

import * as React from "react"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export interface QuickActionCardProps {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconBgClassName?: string
  iconColorClassName?: string
}

export function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  iconBgClassName = "bg-blue-50",
  iconColorClassName = "text-blue-600",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group block space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
          iconBgClassName,
          iconColorClassName
        )}
      >
        <Icon className="size-4" />
      </div>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">{description}</p>
    </Link>
  )
}
