"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminPageShellProps {
  header?: React.ReactNode
  filter?: React.ReactNode
  children: React.ReactNode
  modals?: React.ReactNode
  className?: string
}

export function AdminPageShell({
  header,
  filter,
  children,
  modals,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {header}
      {filter}
      {children}
      {modals}
    </div>
  )
}
