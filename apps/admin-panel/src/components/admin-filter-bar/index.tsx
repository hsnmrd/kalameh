"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminFilterBarProps {
  search?: React.ReactNode
  filters?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function AdminFilterBar({
  search,
  filters,
  children,
  className,
}: AdminFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {search && <div className="w-full sm:w-auto">{search}</div>}
      {(filters || children) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {filters}
          {children}
        </div>
      )}
    </div>
  )
}
