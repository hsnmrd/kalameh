"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useHeaderActions } from "../admin-base-layout/header-actions-context"

export interface AdminPageShellProps {
  /** Optional actions (e.g. three-dot action menu) rendered dynamically in the header next to the page title */
  actions?: React.ReactNode
  filter?: React.ReactNode
  children: React.ReactNode
  modals?: React.ReactNode
  /** Floating action button — rendered after modals (fixed position, mobile-only) */
  fab?: React.ReactNode
  className?: string
}

export function AdminPageShell({
  actions,
  filter,
  children,
  modals,
  fab,
  className,
}: AdminPageShellProps) {
  const { setHeaderActions } = useHeaderActions()

  React.useEffect(() => {
    setHeaderActions(actions ?? null)
    return () => setHeaderActions(null)
  }, [actions, setHeaderActions])

  return (
    <div className={cn("w-full", className)}>
      {filter}
      {children}
      {modals}
      {fab}
    </div>
  )
}
