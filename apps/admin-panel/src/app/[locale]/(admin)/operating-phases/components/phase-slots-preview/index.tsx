"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Coffee, Sparkles } from "lucide-react"
import type { PhaseSlotsCalculationResult } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { PhaseRemainderWarning } from "../phase-remainder-warning"
import { SlotCard } from "../slot-card"

export interface PhaseSlotsPreviewProps {
  calculation: PhaseSlotsCalculationResult
  slotDurationMinutes?: number
  className?: string
}

export function PhaseSlotsPreview({
  calculation,
  slotDurationMinutes = 90,
  className,
}: PhaseSlotsPreviewProps) {
  const t = useTranslations("operating-phases.slotsPreview")

  if (!calculation || calculation.slots.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground",
          className
        )}
      >
        <Clock className="size-5 text-muted-foreground" />
        <p>{t("empty")}</p>
      </div>
    )
  }

  const hours = (calculation.totalSpanMinutes / 60).toFixed(1)
  const hasBreak = Boolean(calculation.breakInfo?.hasBreak)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/80 bg-muted/20 p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <Sparkles className="size-4 text-foreground" />
          <h5 className="text-sm font-semibold text-foreground">
            {t("title")}
          </h5>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {t("fullSlotsCount", { count: calculation.fullSlotsCount })}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t("totalSpan", {
              span: calculation.totalSpanMinutes,
              hours,
            })}
          </span>
        </div>
      </div>

      {/* Warning if Remainder Exists */}
      <PhaseRemainderWarning
        calculation={calculation}
        slotDurationMinutes={slotDurationMinutes}
      />

      {/* Slots List (Separated by Break if active) */}
      {hasBreak && calculation.breakInfo ? (
        <div className="flex flex-col gap-3">
          {/* Shift 1 */}
          {calculation.shift1Slots && calculation.shift1Slots.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground/80">
                {t("shift1Title", { count: calculation.shift1Slots.length })}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {calculation.shift1Slots.map((slot) => (
                  <SlotCard key={slot.slotNumber} slot={slot} />
                ))}
              </div>
            </div>
          )}

          {/* Break Banner */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-medium text-foreground">
            <Coffee className="size-4 shrink-0 text-foreground" />
            <span>
              {t("breakBanner", {
                start: calculation.breakInfo.startTime || "",
                end: calculation.breakInfo.endTime || "",
                duration: calculation.breakInfo.durationMinutes ?? 0,
              })}
            </span>
          </div>

          {/* Shift 2 */}
          {calculation.shift2Slots && calculation.shift2Slots.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground/80">
                {t("shift2Title", { count: calculation.shift2Slots.length })}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {calculation.shift2Slots.map((slot) => (
                  <SlotCard key={slot.slotNumber} slot={slot} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {calculation.slots.map((slot) => (
            <SlotCard key={slot.slotNumber} slot={slot} />
          ))}
        </div>
      )}
    </div>
  )
}
