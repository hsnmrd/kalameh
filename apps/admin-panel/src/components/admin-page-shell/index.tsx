"use client"

import * as React from "react"
import { FABProvider } from "@workspace/ui/components/fab"
import { cn } from "@workspace/ui/lib/utils"
import { usePathname } from "@/i18n/routing"
import { useHeaderActions } from "../admin-base-layout/header-actions-context"
import { isInnerPage } from "../admin-base-layout/mobile-bottom-navigation"

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
  const pathname = usePathname()
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
  const isInner = isInnerPage(pathname) || Boolean(backHref)

  return (
    <FABProvider hasBottomNav={!isInner}>
      <div className={cn("w-full", className)}>
        {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
        {resolvedFilter}
        {children}
        {modals}
        {fab}
      </div>
    </FABProvider>
  )
}
