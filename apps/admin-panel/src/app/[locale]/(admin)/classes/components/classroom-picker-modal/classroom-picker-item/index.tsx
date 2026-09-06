"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Check, AlertTriangle, Users } from "lucide-react"

export interface ClassroomPickerItemProps {
  title: string
  description?: string | null
  capacity?: number | null
  capacityLabel?: string
  branchName?: string | null
  isSelected: boolean
  isWarning?: boolean
  warningText?: string
  icon?: React.ReactNode
  onClick: () => void
}

export function ClassroomPickerItem({
  title,
  description,
  capacity,
  capacityLabel,
  branchName,
  isSelected,
  isWarning,
  warningText,
  icon,
  onClick,
}: ClassroomPickerItemProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full justify-start rounded-2xl border p-3.5 text-start transition-all duration-150 sm:p-4",
        isSelected
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      )}
    >
      <div className="flex w-full items-start gap-3 sm:gap-3.5">
        {/* Leading Icon / Indicator */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm font-semibold sm:text-base",
                isSelected ? "text-primary" : "text-foreground"
              )}
            >
              {title}
            </span>

            {/* Checkmark or Selection Tag */}
            {isSelected && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Check className="size-3.5 text-primary" />
              </span>
            )}
          </div>

          {/* Description if present */}
          {description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}

          {/* Metadata Row: Capacity & Branch & Warning */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            {capacity !== undefined && capacity !== null && (
              <span className="flex items-center gap-1 font-medium text-muted-foreground">
                <Users className="size-3.5 text-muted-foreground" />
                <span>{capacityLabel || `${capacity} نفر`}</span>
              </span>
            )}

            {branchName && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {branchName}
              </span>
            )}

            {isWarning && warningText && (
              <span className="flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                <AlertTriangle className="size-3 shrink-0 text-warning" />
                <span>{warningText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Button>
  )
}
