"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
  ResponsiveDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
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
  /** Keep revealed on mobile (e.g. active filter or active search) */
  isPinned?: boolean
  /** Whether auto-collapsing on mobile scroll is enabled (default: true) */
  autoHideOnMobile?: boolean
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
  isPinned = false,
  autoHideOnMobile = true,
}: AdminFilterBarProps) {
  const t = useTranslations("common.filter")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const hasFilters = Boolean(filters || children)
  const hasActiveFilters = Boolean(isPinned || activeFiltersCount > 0)

  const { isRevealed } = useMobileScrollReveal({
    pinned: hasActiveFilters || dialogOpen || !autoHideOnMobile,
  })

  const resolvedDialogTitle = filterDialogTitle || t("title")
  const resolvedButtonLabel = filterButtonLabel || t("button")
  const resolvedButtonAriaLabel = filterButtonAriaLabel || t("button")

  return (
    <>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
          // Mobile collapsible styling: 0fr with 0 margin when hidden, 1fr with mb-4 when revealed
          isRevealed
            ? "mb-4 grid-rows-[1fr] opacity-100"
            : "pointer-events-none mb-0 grid-rows-[0fr] opacity-0",
          // Desktop resets: always 1fr with mb-6
          "lg:pointer-events-auto lg:mb-6 lg:grid-rows-[1fr] lg:overflow-visible lg:opacity-100",
          className
        )}
      >
        <div className="overflow-hidden">
          <div className="flex w-full min-w-0 items-center gap-2 pb-0.5 sm:gap-3">
            {/* Search slot — stretches with flex-1 */}
            {search && <div className="min-w-0 flex-1">{search}</div>}

            {/* Unified Filter Button (Desktop Modal / Mobile Drawer) */}
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(true)}
                aria-label={resolvedButtonAriaLabel}
                className={cn(
                  "size-14 min-w-14 shrink-0 cursor-pointer gap-2 rounded-2xl border-border px-3.5 transition-all hover:bg-muted active:scale-95 sm:w-auto sm:px-4",
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
                <span className="hidden text-sm font-semibold sm:inline">
                  {resolvedButtonLabel}
                </span>
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-[11px] font-bold"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal (Desktop) / Bottom-Sheet Drawer (Mobile) */}
      {hasFilters && (
        <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <ResponsiveDialogContent className="sm:max-w-md">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>
                {resolvedDialogTitle}
              </ResponsiveDialogTitle>
              <ResponsiveDialogCloseButton />
            </ResponsiveDialogHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4 py-3 sm:px-0">
              {filters}
              {children}
            </div>

            <ResponsiveDialogFooter className="flex-row items-center gap-2 pt-2 sm:justify-end">
              {onClearFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl font-medium"
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
                className="h-11 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 sm:flex-initial sm:px-6"
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
