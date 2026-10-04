"use client"

import * as React from "react"
import { Check } from "lucide-react"
import type { PhaseGeneratedSlot } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface SlotButtonProps {
  slot: PhaseGeneratedSlot
  isSelected: boolean
  onToggle: () => void
  disabled?: boolean
}

export function SlotButton({
  slot,
  isSelected,
  onToggle,
  disabled = false,
}: SlotButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "group relative flex h-14 min-w-[120px] flex-col items-center justify-center gap-0.5 rounded-2xl border px-3 transition-all",
        isSelected
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20"
          : "border-border/70 bg-card text-foreground hover:border-border hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-1.5">
        {isSelected && <Check className="size-3.5 text-primary" />}
        <span className="text-xs font-semibold">
          {slot.startTime} - {slot.endTime}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        {slot.durationMinutes} دقیقه
      </span>
    </Button>
  )
}
