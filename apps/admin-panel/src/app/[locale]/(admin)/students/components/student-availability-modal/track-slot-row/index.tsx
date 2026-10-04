"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, CalendarX } from "lucide-react"
import type {
  PhaseGeneratedSlot,
  StudentAvailabilitySlotInput,
  WeekDay,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { SlotButton } from "../slot-button"

export interface TrackSlotRowProps {
  trackTitle: string
  days: WeekDay[]
  slots: PhaseGeneratedSlot[]
  value: StudentAvailabilitySlotInput[]
  onToggleSlot: (days: WeekDay[], slot: PhaseGeneratedSlot) => void
  onSelectAllTrack: (days: WeekDay[], slots: PhaseGeneratedSlot[]) => void
  onClearTrack: (days: WeekDay[]) => void
  disabled?: boolean
}

export function TrackSlotRow({
  trackTitle,
  days,
  slots,
  value,
  onToggleSlot,
  onSelectAllTrack,
  onClearTrack,
  disabled = false,
}: TrackSlotRowProps) {
  const t = useTranslations("students.availabilityModal")

  const isSlotSelected = React.useCallback(
    (slot: PhaseGeneratedSlot) => {
      if (days.length === 0) return false
      return days.every((day) =>
        value.some(
          (item) =>
            item.dayOfWeek === day &&
            item.startTime === slot.startTime &&
            item.endTime === slot.endTime
        )
      )
    },
    [days, value]
  )

  const selectedCount = React.useMemo(() => {
    return slots.filter((slot) => isSlotSelected(slot)).length
  }, [slots, isSlotSelected])

  const isAllSelected = slots.length > 0 && selectedCount === slots.length
  const hasAnySelected = selectedCount > 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {trackTitle}
          </span>
          {hasAnySelected && (
            <Badge variant="secondary" className="text-xs font-medium">
              {t("selectedSlotsCount", { count: selectedCount })}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isAllSelected}
            onClick={() => onSelectAllTrack(days, slots)}
            className="h-8 gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <CalendarCheck className="size-3.5 text-muted-foreground" />
            <span>{t("selectAll")}</span>
          </Button>

          {hasAnySelected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onClearTrack(days)}
              className="h-8 gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <CalendarX className="size-3.5 text-muted-foreground" />
              <span>{t("clear")}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {slots.map((slot) => (
          <SlotButton
            key={`${slot.slotNumber}-${slot.startTime}`}
            slot={slot}
            isSelected={isSlotSelected(slot)}
            onToggle={() => onToggleSlot(days, slot)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
