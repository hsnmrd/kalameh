"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminPageShellProps {
  header?: React.ReactNode
  filter?: React.ReactNode
  children: React.ReactNode
  modals?: React.ReactNode
  /** Floating action button — rendered after modals (fixed position, mobile-only) */
  fab?: React.ReactNode
  className?: string
}

export function AdminPageShell({
  header,
  filter,
  children,
  modals,
  fab,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {header}
      {filter}
      {children}
      {modals}
      {fab}
    </div>
  )
}
