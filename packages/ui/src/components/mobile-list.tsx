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
        "-mx-4 flex w-[calc(100%+2rem)] flex-col select-none [-webkit-touch-callout:none] sm:mx-0 sm:w-full",
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
          "flex min-h-[64px] w-full cursor-pointer touch-manipulation items-center gap-3.5 px-4 py-3 transition-colors select-none [-webkit-touch-callout:none] hover:bg-muted/30 active:bg-muted/50",
          className
        )}
      >
        {children}
      </div>
      {!isLast && (
        <div className="w-full" aria-hidden>
          <div className="ms-[4.5rem] h-px bg-border/60" />
        </div>
      )}
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
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground",
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
    <div className={cn("min-w-0 flex-1 space-y-1", className)}>
      <div className="truncate text-[15px] font-medium tracking-tight text-foreground">
        {primary}
      </div>
      {secondary && (
        <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
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
    <div className={cn("flex shrink-0 items-center gap-2", className)}>
      {children}
    </div>
  )
}
