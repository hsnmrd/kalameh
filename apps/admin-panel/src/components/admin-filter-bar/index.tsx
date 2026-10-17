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
  /** @deprecated No longer used. Kept for backwards compatibility. */
  isPinned?: boolean
  /** @deprecated No longer used. Auto-collapsing on mobile scroll has been removed. */
  autoHideOnMobile?: boolean
  /** When true (e.g. list is empty), hides the filter and search bar on mobile screens (< lg) */
  isEmpty?: boolean
  /** Actions rendered next to filter button (e.g. Add Button on desktop) */
  actions?: React.ReactNode
  /** Whether filter interactions are disabled */
  disabled?: boolean
  /** Custom icon element for the filter button (defaults to SlidersHorizontal) */
  filterIcon?: React.ReactNode
  /** Optional custom className applied to the filter button */
  filterButtonClassName?: string
  /** Optional custom footer element for the dialog / bottom sheet */
  filterDialogFooter?: React.ReactNode
  /** Controlled open state for the dialog / bottom sheet */
  dialogOpen?: boolean
  /** Callback for when the dialog / bottom sheet open state changes */
  onDialogOpenChange?: (open: boolean) => void
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
  isEmpty = false,
  actions,
  disabled = false,
  filterIcon,
  filterButtonClassName,
  filterDialogFooter,
  dialogOpen: controlledDialogOpen,
  onDialogOpenChange,
}: AdminFilterBarProps) {
  const t = useTranslations("common.filter")
  const locale = useLocale()
  const [internalDialogOpen, setInternalDialogOpen] = React.useState(false)
  const isControlled = controlledDialogOpen !== undefined
  const dialogOpen = isControlled ? controlledDialogOpen : internalDialogOpen
  const setDialogOpen = React.useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setInternalDialogOpen(open)
      }
      onDialogOpenChange?.(open)
    },
    [isControlled, onDialogOpenChange]
  )
  const hasDialog = Boolean(filters || children)
  const hasFilters = Boolean(hasDialog || onFilterClick)
  const hasActiveFilters = Boolean(isPinned || activeFiltersCount > 0)

  const resolvedDialogTitle = filterDialogTitle || t("title")
  const resolvedButtonLabel = filterButtonLabel || t("button")
  const resolvedButtonAriaLabel =
    filterButtonAriaLabel || filterButtonLabel || t("button")

  const resolvedIcon = filterIcon ?? (
    <SlidersHorizontal
      className={cn(
        "size-5 shrink-0",
        hasActiveFilters ? "text-primary" : "text-muted-foreground"
      )}
    />
  )

  return (
    <>
      <div
        className={cn(
          "mb-4 w-full max-w-full min-w-0",
          "lg:sticky lg:top-16 lg:z-20 lg:mb-6 lg:overflow-visible lg:bg-background/95 lg:py-2.5 lg:backdrop-blur-md",
          isEmpty && "hidden lg:block",
          className
        )}
      >
        <div className="w-full max-w-full min-w-0 overflow-x-clip lg:overflow-visible">
          <div className="flex w-full max-w-full min-w-0 items-center gap-2 pt-1.5 pb-1 sm:gap-3 sm:pt-0 sm:pb-0.5">
            {/* Search slot — stretches with flex-1 */}
            {search && (
              <div className="max-w-full min-w-0 flex-1 overflow-hidden">
                {search}
              </div>
            )}

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
                    "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10",
                  filterButtonClassName
                )}
              >
                {resolvedIcon}
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
                {resolvedButtonLabel && (
                  <span className="hidden text-sm font-semibold sm:inline">
                    {resolvedButtonLabel}
                  </span>
                )}
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

            {filterDialogFooter !== undefined ? (
              filterDialogFooter
            ) : (
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
            )}
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}
    </>
  )
}
