"use client"

import * as React from "react"
import { Plus, MoreVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface FABProps {
  onClick: () => void
  "aria-label": string
  className?: string
  children?: React.ReactNode
}

/**
 * FABSingle — single floating action button (create / primary action).
 * Fixed bottom-end, always above content on mobile.
 */
export function FABSingle({
  onClick,
  "aria-label": ariaLabel,
  className,
  children,
}: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed end-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95 lg:hidden",
        className
      )}
    >
      {children ?? <Plus className="size-6" aria-hidden />}
    </button>
  )
}

/**
 * FABMenu — floating action button that shows a three-dot icon.
 * Used when a page has multiple list-level actions (e.g. create + import + export).
 * The content to show in the menu is passed as children and rendered by the parent
 * inside a Popover / Drawer.
 */
export interface FABMenuTriggerProps {
  onClick: () => void
  "aria-label": string
  className?: string
}

export function FABMenuTrigger({
  onClick,
  "aria-label": ariaLabel,
  className,
}: FABMenuTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed end-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 lg:hidden",
        className
      )}
    >
      <MoreVertical className="size-6" aria-hidden />
    </button>
  )
}
