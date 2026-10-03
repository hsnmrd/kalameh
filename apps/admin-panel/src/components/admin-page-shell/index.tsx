"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useHeaderActions } from "../admin-base-layout/header-actions-context"

export interface AdminPageShellProps {
  /** Optional breadcrumb navigation displayed on top of the filter section (standard for inner/sub-pages) */
  breadcrumb?: React.ReactNode
  /** Optional back link URL displayed as an icon button in the header next to the page title */
  backHref?: string
  /** Optional accessible label for the back button */
  backLabel?: string
  /** Optional actions (e.g. three-dot action menu) rendered dynamically in the header next to the page title */
  actions?: React.ReactNode
  filter?: React.ReactNode
  filters?: React.ReactNode
  children: React.ReactNode
  modals?: React.ReactNode
  /** Floating action button — rendered after modals (fixed position, mobile-only) */
  fab?: React.ReactNode
  className?: string
}

export function AdminPageShell({
  breadcrumb,
  backHref,
  backLabel,
  actions,
  filter,
  filters,
  children,
  modals,
  fab,
  className,
}: AdminPageShellProps) {
  const { setHeaderActions, setBackNavigation } = useHeaderActions()

  React.useEffect(() => {
    setHeaderActions(actions ?? null)
    return () => setHeaderActions(null)
  }, [actions, setHeaderActions])

  React.useEffect(() => {
    if (backHref) {
      setBackNavigation({ backHref, backLabel })
      return () => setBackNavigation(null)
    }
  }, [backHref, backLabel, setBackNavigation])

  const resolvedFilter = filter ?? filters

  return (
    <div className={cn("w-full", className)}>
      {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
      {resolvedFilter}
      {children}
      {modals}
      {fab}
    </div>
  )
}
