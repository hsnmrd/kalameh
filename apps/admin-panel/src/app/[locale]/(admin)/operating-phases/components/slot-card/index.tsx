"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { PhaseGeneratedSlot } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"

export interface SlotCardProps {
  slot: PhaseGeneratedSlot
}

export function SlotCard({ slot }: SlotCardProps) {
  const t = useTranslations("operating-phases.slotsPreview")

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs">
      <span className="font-medium text-foreground">
        {t("slotItem", {
          number: slot.slotNumber,
          start: slot.startTime,
          end: slot.endTime,
        })}
      </span>
      <Badge variant="outline" className="text-[10px]">
        {slot.durationMinutes}m
      </Badge>
    </div>
  )
}
