"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowRight, Calendar, Check, Clock, Coffee } from "lucide-react"
import {
  JALALI_MONTHS,
  type PhaseSlotsCalculationResult,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { PhaseSlotsPreview } from "../phase-slots-preview"

export interface PhaseSlotsReviewProps {
  title: string
  months: number[]
  startTime: string
  endTime: string
  slotDurationMinutes: number
  hasBreak?: boolean
  breakStartTime?: string | null
  breakEndTime?: string | null
  calculation: PhaseSlotsCalculationResult
  onEditAgain: () => void
  onConfirm: () => void
  isSubmitting: boolean
  confirmText?: string
}

export function PhaseSlotsReview({
  title,
  months,
  startTime,
  endTime,
  slotDurationMinutes,
  hasBreak,
  breakStartTime,
  breakEndTime,
  calculation,
  onEditAgain,
  onConfirm,
  isSubmitting,
  confirmText,
}: PhaseSlotsReviewProps) {
  const t = useTranslations("operating-phases.review")

  const monthNames = React.useMemo(() => {
    return months
      .map((id) => JALALI_MONTHS.find((m) => m.id === id)?.nameFa)
      .filter(Boolean)
      .join("، ")
  }, [months])

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        {/* Phase Summary Bar */}
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {title || t("phaseInfo")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {t("totalSlots", { count: calculation.fullSlotsCount })}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {t("duration", { minutes: slotDurationMinutes })}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <span>{t("shiftHours", { start: startTime, end: endTime })}</span>
            </div>

            {hasBreak && breakStartTime && breakEndTime && (
              <div className="flex items-center gap-1.5">
                <Coffee className="size-3.5 text-muted-foreground" />
                <span>
                  {t("breakHours", {
                    start: breakStartTime,
                    end: breakEndTime,
                  })}
                </span>
              </div>
            )}

            {monthNames && (
              <span className="max-w-[280px] truncate" title={monthNames}>
                {monthNames}
              </span>
            )}
          </div>
        </div>

        {/* Generated Slots Breakdown */}
        <PhaseSlotsPreview
          calculation={calculation}
          slotDurationMinutes={slotDurationMinutes}
        />
      </div>

      {/* Review Footer Actions */}
      <FormDialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onEditAgain}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          <ArrowRight className="size-4" />
          <span>{t("editAgain")}</span>
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <Check className="size-4" />
              <span>{confirmText || t("confirmAndCreate")}</span>
            </>
          )}
        </Button>
      </FormDialogFooter>
    </div>
  )
}
