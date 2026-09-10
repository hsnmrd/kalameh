"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import type { PhaseSlotsCalculationResult } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"

export interface PhaseRemainderWarningProps {
  calculation?: PhaseSlotsCalculationResult | null
  slotDurationMinutes?: number
  className?: string
}

export function PhaseRemainderWarning({
  calculation,
  slotDurationMinutes = 90,
  className,
}: PhaseRemainderWarningProps) {
  const t = useTranslations("operating-phases.slotsPreview")
  const locale = useLocale()

  if (!calculation || !calculation.hasWarning) {
    return null
  }

  const warningMessage =
    (locale === "en"
      ? calculation.warningMessageEn
      : calculation.warningMessageFa) ||
    t("remainderWarning", {
      duration: slotDurationMinutes,
      remainder: calculation.remainderMinutes,
    })

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning",
        className
      )}
    >
      <AlertTriangle className="size-4 shrink-0 text-warning" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">{warningMessage}</span>
      </div>
    </div>
  )
}
