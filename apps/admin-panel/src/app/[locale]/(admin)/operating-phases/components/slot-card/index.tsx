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
    <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3.5 shadow-2xs transition-colors hover:border-primary/40">
      <div className="flex items-center gap-1.5 text-sm text-foreground sm:text-base">
        <span className="font-medium text-foreground/85">
          {t("slotLabel", { number: slot.slotNumber })}:
        </span>
        <span className="font-bold text-foreground">
          {slot.startTime} {t("rangeSeparator")} {slot.endTime}
        </span>
      </div>
      <Badge
        variant="secondary"
        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground"
      >
        {t("slotDuration", { duration: slot.durationMinutes })}
      </Badge>
    </div>
  )
}
