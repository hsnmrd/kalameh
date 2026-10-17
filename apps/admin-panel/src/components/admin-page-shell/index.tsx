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
  /** Optional className for the breadcrumb wrapper container */
  breadcrumbClassName?: string
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
  /** Whether the list is empty (hides filter section on mobile size) */
  isEmpty?: boolean
}

export function AdminPageShell({
  breadcrumb,
  breadcrumbClassName,
  backHref,
  backLabel,
  actions,
  filter,
  filters,
  children,
  modals,
  fab,
  className,
  isEmpty = false,
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
      <div
        className={cn(
          "flex w-full max-w-full min-w-0 flex-1 flex-col",
          className
        )}
      >
        {breadcrumb && (
          <div className={cn("mb-4", breadcrumbClassName)}>{breadcrumb}</div>
        )}
        {resolvedFilter && (
          <div className={isEmpty ? "hidden lg:contents" : "contents"}>
            {resolvedFilter}
          </div>
        )}
        {children}
        {modals}
        {fab}
      </div>
    </FABProvider>
  )
}
