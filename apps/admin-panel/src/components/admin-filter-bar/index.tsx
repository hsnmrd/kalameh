"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@workspace/ui/components/drawer"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminFilterBarProps {
  search?: React.ReactNode
  filters?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Title shown in the mobile filter drawer */
  filterDrawerTitle?: string
  /** aria-label for the mobile filter icon button */
  filterButtonAriaLabel?: string
}

export function AdminFilterBar({
  search,
  filters,
  children,
  className,
  filterDrawerTitle,
  filterButtonAriaLabel,
}: AdminFilterBarProps) {
  const t = useTranslations("common.filter")
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const hasFilters = Boolean(filters || children)

  const resolvedDrawerTitle = filterDrawerTitle || t("title")
  const resolvedButtonAriaLabel = filterButtonAriaLabel || t("button")

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        {/* Search + mobile filter icon row */}
        <div className="flex w-full min-w-0 items-center gap-2">
          {search && <div className="min-w-0 flex-1">{search}</div>}

          {/* Mobile filter icon button — hidden on desktop */}
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label={resolvedButtonAriaLabel}
              className="size-14 min-w-14 shrink-0 rounded-2xl border-border lg:hidden"
            >
              <SlidersHorizontal className="size-5 text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Desktop filters — hidden on mobile */}
        {hasFilters && (
          <div className="hidden flex-wrap items-center gap-2.5 lg:flex">
            {filters}
            {children}
          </div>
        )}
      </div>

      {/* Mobile filter bottom-sheet drawer */}
      {hasFilters && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{resolvedDrawerTitle}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4 pt-2">
              {filters}
              {children}
            </div>
            <DrawerFooter className="pb-safe-or-6 pt-3">
              <Button
                type="button"
                className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                onClick={() => setDrawerOpen(false)}
              >
                {t("show")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
