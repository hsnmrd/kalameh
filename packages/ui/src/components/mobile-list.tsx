"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

// ─── MobileList ─────────────────────────────────────────────────────────────

export interface MobileListProps {
  children: React.ReactNode
  className?: string
}

export function MobileList({ children, className }: MobileListProps) {
  return (
    <div
      role="list"
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── MobileListItem ──────────────────────────────────────────────────────────

export interface MobileListItemProps {
  /** Primary click handler — navigates to detail or opens edit modal */
  onClick?: () => void
  /** Context menu content — rendered inside a ContextMenu on long-press */
  children: React.ReactNode
  className?: string
  isLast?: boolean
}

export function MobileListItem({
  onClick,
  children,
  className,
  isLast = false,
}: MobileListItemProps) {
  return (
    <>
      <div
        role="listitem"
        onClick={onClick}
        className={cn(
          "flex min-h-[60px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60",
          className
        )}
      >
        {children}
      </div>
      {!isLast && <div className="h-px bg-border" aria-hidden />}
    </>
  )
}

// ─── MobileListItemIcon ───────────────────────────────────────────────────────

export interface MobileListItemIconProps {
  children: React.ReactNode
  className?: string
}

export function MobileListItemIcon({
  children,
  className,
}: MobileListItemIconProps) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── MobileListItemContent ────────────────────────────────────────────────────

export interface MobileListItemContentProps {
  primary: React.ReactNode
  secondary?: React.ReactNode
  className?: string
}

export function MobileListItemContent({
  primary,
  secondary,
  className,
}: MobileListItemContentProps) {
  return (
    <div className={cn("min-w-0 flex-1 space-y-0.5", className)}>
      <div className="truncate text-sm font-semibold text-foreground">
        {primary}
      </div>
      {secondary && (
        <div className="truncate text-xs text-muted-foreground">
          {secondary}
        </div>
      )}
    </div>
  )
}

// ─── MobileListItemTrailing ───────────────────────────────────────────────────

export interface MobileListItemTrailingProps {
  children: React.ReactNode
  className?: string
}

export function MobileListItemTrailing({
  children,
  className,
}: MobileListItemTrailingProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      {children}
    </div>
  )
}
