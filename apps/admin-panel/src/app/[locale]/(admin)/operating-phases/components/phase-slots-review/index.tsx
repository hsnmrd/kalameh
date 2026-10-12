"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowRight, Calendar, Check, Clock, Coffee } from "lucide-react"
import {
  JALALI_MONTHS,
  type PhaseSlotsCalculationResult,
} from "@workspace/types"
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
        <div className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Calendar className="size-4 text-foreground" />
            </div>
            <span className="truncate text-sm font-bold text-foreground sm:text-base">
              {title || t("phaseInfo")}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            {monthNames && (
              <span
                className="max-w-[180px] truncate sm:max-w-[300px]"
                title={monthNames}
              >
                {monthNames}
              </span>
            )}
            {monthNames && <span className="opacity-40">•</span>}
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <span>{t("shiftHours", { start: startTime, end: endTime })}</span>
            </div>
            {hasBreak && breakStartTime && breakEndTime && (
              <>
                <span className="opacity-40">•</span>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Coffee className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {t("breakHours", {
                      start: breakStartTime,
                      end: breakEndTime,
                    })}
                  </span>
                </div>
              </>
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
