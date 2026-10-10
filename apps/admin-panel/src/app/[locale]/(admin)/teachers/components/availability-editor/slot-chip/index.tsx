"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface SlotChipProps {
  slotNumber: number
  startTime: string
  endTime: string
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
  occupiedBranchName?: string | null
  className?: string
}

export function SlotChip({
  slotNumber,
  startTime,
  endTime,
  isSelected,
  onToggle,
  disabled = false,
  occupiedBranchName,
  className,
}: SlotChipProps) {
  const t = useTranslations("teachers.availabilities")
  const isOccupied = Boolean(occupiedBranchName)
  const effectiveDisabled = disabled || isOccupied

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={effectiveDisabled}
      onClick={isOccupied ? undefined : onToggle}
      title={
        isOccupied
          ? t("occupiedInOtherBranchTooltip", { branch: occupiedBranchName! })
          : undefined
      }
      className={cn(
        "flex h-auto w-full flex-col items-stretch justify-center gap-1.5 rounded-2xl border p-3 text-start transition-all",
        isOccupied
          ? "cursor-not-allowed border-dashed border-border/80 bg-muted/40 text-muted-foreground opacity-75 hover:border-border/80 hover:bg-muted/40"
          : isSelected
            ? "cursor-pointer border-primary bg-primary/10 text-primary shadow-2xs hover:bg-primary/15"
            : "cursor-pointer border-border bg-background text-foreground hover:border-border/80 hover:bg-muted/40",
        className
      )}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-center justify-between gap-1">
        <span
          className={cn(
            "truncate text-xs font-medium",
            isOccupied
              ? "text-muted-foreground"
              : isSelected
                ? "text-primary"
                : "text-muted-foreground"
          )}
        >
          {t("slotLabel", { slotNumber })}
        </span>
        {isOccupied ? (
          <span className="max-w-[120px] truncate rounded-md border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t("occupiedInOtherBranch", { branch: occupiedBranchName! })}
          </span>
        ) : (
          <div
            className={cn(
              "flex size-4.5 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "border border-border/80 bg-card"
            )}
          >
            {isSelected && (
              <Check className="size-2.5 shrink-0 stroke-[3]" aria-hidden />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5" dir="ltr">
        <Clock
          className={cn(
            "size-3 shrink-0",
            isOccupied
              ? "text-muted-foreground"
              : isSelected
                ? "text-primary"
                : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-sm font-semibold tracking-tight",
            isOccupied
              ? "text-muted-foreground"
              : isSelected
                ? "text-primary"
                : "text-foreground"
          )}
        >
          {startTime} - {endTime}
        </span>
      </div>
    </Button>
  )
}
