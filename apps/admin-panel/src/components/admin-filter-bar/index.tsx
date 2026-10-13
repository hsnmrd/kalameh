"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { AvatarBadge } from "@workspace/ui/components/avatar"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { useMobileScrollReveal } from "@/lib/hooks"

export interface AdminFilterBarProps {
  search?: React.ReactNode
  filters?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Title shown in the modal / bottom sheet header */
  filterDialogTitle?: string
  /** Text label for the filter button */
  filterButtonLabel?: string
  /** aria-label for the filter button */
  filterButtonAriaLabel?: string
  /** Number of currently active filters to display as a badge */
  activeFiltersCount?: number
  /** Callback to clear all active filters */
  onClearFilters?: () => void
  /** Custom callback when filter button is clicked (bypasses internal dialog) */
  onFilterClick?: () => void
  /** Keep revealed on mobile (e.g. active filter or active search) */
  isPinned?: boolean
  /** Whether auto-collapsing on mobile scroll is enabled (default: true) */
  autoHideOnMobile?: boolean
  /** Actions rendered next to filter button (e.g. Add Button on desktop) */
  actions?: React.ReactNode
  /** Whether filter interactions are disabled */
  disabled?: boolean
}

export function AdminFilterBar({
  search,
  filters,
  children,
  className,
  filterDialogTitle,
  filterButtonLabel,
  filterButtonAriaLabel,
  activeFiltersCount = 0,
  onClearFilters,
  onFilterClick,
  isPinned = false,
  autoHideOnMobile = true,
  actions,
  disabled = false,
}: AdminFilterBarProps) {
  const t = useTranslations("common.filter")
  const locale = useLocale()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const hasDialog = Boolean(filters || children)
  const hasFilters = Boolean(hasDialog || onFilterClick)
  const hasActiveFilters = Boolean(isPinned || activeFiltersCount > 0)

  const { isRevealed } = useMobileScrollReveal({
    pinned: hasActiveFilters || dialogOpen || !autoHideOnMobile,
  })

  const resolvedDialogTitle = filterDialogTitle || t("title")
  const resolvedButtonLabel = filterButtonLabel || t("button")
  const resolvedButtonAriaLabel =
    filterButtonAriaLabel || filterButtonLabel || t("button")

  return (
    <>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
          // Mobile collapsible styling: 0fr with 0 margin when hidden, 1fr with mb-4 when revealed
          isRevealed
            ? "mb-4 grid-rows-[1fr] opacity-100"
            : "pointer-events-none mb-0 grid-rows-[0fr] opacity-0",
          // Desktop resets: sticky under header (top-16), always 1fr with mb-6
          "lg:pointer-events-auto lg:sticky lg:top-16 lg:z-20 lg:mb-6 lg:grid-rows-[1fr] lg:overflow-visible lg:bg-background/95 lg:py-2.5 lg:opacity-100 lg:backdrop-blur-md",
          className
        )}
      >
        <div
          className={cn(isRevealed ? "overflow-visible" : "overflow-hidden")}
        >
          <div className="flex w-full min-w-0 items-center gap-2 pt-1.5 pb-1 sm:gap-3 sm:pt-0 sm:pb-0.5">
            {/* Search slot — stretches with flex-1 */}
            {search && <div className="min-w-0 flex-1">{search}</div>}

            {/* Unified Filter Button (Desktop Modal / Mobile Drawer) */}
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (onFilterClick) {
                    onFilterClick()
                  } else {
                    setDialogOpen(true)
                  }
                }}
                disabled={disabled}
                aria-label={resolvedButtonAriaLabel}
                className={cn(
                  "relative size-14 min-w-14 shrink-0 cursor-pointer gap-2 rounded-2xl border-border px-3.5 transition-all hover:bg-muted active:scale-95 sm:w-auto sm:px-4",
                  hasActiveFilters &&
                    "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                )}
              >
                <SlidersHorizontal
                  className={cn(
                    "size-5 shrink-0",
                    hasActiveFilters ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {activeFiltersCount > 0 && (
                  <>
                    <AvatarBadge className="-end-1.5 -top-1.5 bottom-auto flex size-5 min-w-5 items-center justify-center px-1 text-[11px] leading-none font-bold sm:hidden">
                      {formatNumber(activeFiltersCount, locale)}
                    </AvatarBadge>
                    <Badge
                      variant="secondary"
                      className="hidden h-5 min-w-5 rounded-full px-1.5 text-[11px] font-bold sm:inline-flex"
                    >
                      {formatNumber(activeFiltersCount, locale)}
                    </Badge>
                  </>
                )}
                <span className="hidden text-sm font-semibold sm:inline">
                  {resolvedButtonLabel}
                </span>
              </Button>
            )}

            {/* Desktop Actions Slot (e.g. Add Button) — hidden on mobile where FAB is used */}
            {actions && (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal (Desktop) / Bottom-Sheet Drawer (Mobile) */}
      {hasDialog && (
        <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <ResponsiveDialogContent className="overflow-hidden p-0 sm:max-w-md">
            <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
              <ResponsiveDialogTitle>
                {resolvedDialogTitle}
              </ResponsiveDialogTitle>
              <ResponsiveDialogCloseButton />
            </ResponsiveDialogHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {filters}
              {children}
            </div>

            <ResponsiveDialogFooter className="flex-row items-center gap-3 border-t border-border/60 bg-muted/20 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:justify-end sm:px-6 sm:py-4">
              {onClearFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  onClick={() => {
                    onClearFilters()
                    setDialogOpen(false)
                  }}
                >
                  {t("clear")}
                </Button>
              )}
              <Button
                type="button"
                className="flex-1 sm:flex-initial"
                onClick={() => setDialogOpen(false)}
              >
                {t("show")}
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}
    </>
  )
}
