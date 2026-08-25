"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
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
  filterDrawerTitle = "فیلترها",
  filterButtonAriaLabel = "فیلتر",
}: AdminFilterBarProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const hasFilters = Boolean(filters || children)

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        {/* Search + mobile filter icon row */}
        <div className="flex items-center gap-2">
          {search && <div className="flex-1">{search}</div>}

          {/* Mobile filter icon button — hidden on desktop */}
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              aria-label={filterButtonAriaLabel}
              className="h-10 w-10 shrink-0 rounded-xl border-border lg:hidden"
            >
              <SlidersHorizontal className="size-4 text-muted-foreground" />
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
              <DrawerTitle>{filterDrawerTitle}</DrawerTitle>
            </DrawerHeader>
            <div className="pb-safe-or-6 flex flex-col gap-4 overflow-y-auto px-4 pt-2">
              {filters}
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
