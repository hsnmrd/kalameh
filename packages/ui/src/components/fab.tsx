"use client"

import * as React from "react"
import { Plus, MoreVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface FABContextValue {
  /**
   * Whether a bottom navigation bar is present. When false (e.g. on inner pages),
   * the FAB is positioned closer to the screen bottom (1.5rem instead of 5.5rem).
   */
  hasBottomNav?: boolean
}

export const FABContext = React.createContext<FABContextValue>({
  hasBottomNav: true,
})

export function FABProvider({
  hasBottomNav = true,
  children,
}: {
  hasBottomNav?: boolean
  children: React.ReactNode
}) {
  return (
    <FABContext.Provider value={{ hasBottomNav }}>
      {children}
    </FABContext.Provider>
  )
}

export function useFABContext(): FABContextValue {
  return React.useContext(FABContext)
}

export interface FABProps {
  onClick: () => void
  "aria-label": string
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  /**
   * Explicit override for bottom navigation presence.
   * If omitted, inherits from FABProvider context (defaults to true).
   */
  hasBottomNav?: boolean
}

/**
 * FABSingle — single floating action button (create / primary action).
 * Fixed start-6, always above content on mobile.
 */
export function FABSingle({
  onClick,
  "aria-label": ariaLabel,
  className,
  children,
  disabled = false,
  hasBottomNav: hasBottomNavProp,
}: FABProps) {
  const context = useFABContext()
  const hasBottomNav = hasBottomNavProp ?? context.hasBottomNav ?? true

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "fixed start-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95 disabled:pointer-events-none disabled:opacity-50 lg:hidden",
        hasBottomNav
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
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
  children?: React.ReactNode
  /**
   * Explicit override for bottom navigation presence.
   * If omitted, inherits from FABProvider context (defaults to true).
   */
  hasBottomNav?: boolean
}

export function FABMenuTrigger({
  onClick,
  "aria-label": ariaLabel,
  className,
  children,
  hasBottomNav: hasBottomNavProp,
}: FABMenuTriggerProps) {
  const context = useFABContext()
  const hasBottomNav = hasBottomNavProp ?? context.hasBottomNav ?? true

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed start-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 lg:hidden",
        hasBottomNav
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
        className
      )}
    >
      {children ?? <MoreVertical className="size-6" aria-hidden />}
    </button>
  )
}
