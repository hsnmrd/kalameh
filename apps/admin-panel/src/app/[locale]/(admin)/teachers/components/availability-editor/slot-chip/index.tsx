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
}

export function SlotChip({
  slotNumber,
  startTime,
  endTime,
  isSelected,
  onToggle,
  disabled = false,
}: SlotChipProps) {
  const t = useTranslations("teachers.availabilities")

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex h-auto cursor-pointer flex-col items-stretch justify-center gap-1.5 rounded-2xl border p-3 text-start transition-all",
        isSelected
          ? "border-primary bg-primary/10 text-primary shadow-2xs hover:bg-primary/15"
          : "border-border bg-background text-foreground hover:border-border/80 hover:bg-muted/40"
      )}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
        >
          {t("slotLabel", { slotNumber })}
        </span>
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
      </div>

      <div className="flex items-center gap-1.5" dir="ltr">
        <Clock
          className={cn(
            "size-3 shrink-0",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-sm font-semibold tracking-tight",
            isSelected ? "text-primary" : "text-foreground"
          )}
        >
          {startTime} - {endTime}
        </span>
      </div>
    </Button>
  )
}
