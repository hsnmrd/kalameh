"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Coffee, Sparkles } from "lucide-react"
import type { SuggestedPhaseBreakWindow } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { TimePicker } from "@workspace/ui/components/time-picker"
import { cn } from "@workspace/ui/lib/utils"

export interface PhaseBreakSectionProps {
  idPrefix: string
  hasBreak: boolean
  onHasBreakChange: (hasBreak: boolean) => void
  breakStartTime?: string | null
  onBreakStartTimeChange: (time: string) => void
  breakEndTime?: string | null
  onBreakEndTimeChange: (time: string) => void
  suggestedBreak: SuggestedPhaseBreakWindow
  errors?: {
    breakStartTime?: { message?: string }
    breakEndTime?: { message?: string }
  }
  disabled?: boolean
}

export function PhaseBreakSection({
  idPrefix,
  hasBreak,
  onHasBreakChange,
  breakStartTime,
  onBreakStartTimeChange,
  breakEndTime,
  onBreakEndTimeChange,
  suggestedBreak,
  errors,
  disabled,
}: PhaseBreakSectionProps) {
  const t = useTranslations("operating-phases")

  const handleToggle = React.useCallback(() => {
    if (disabled) return
    const nextVal = !hasBreak
    onHasBreakChange(nextVal)
    if (nextVal) {
      onBreakStartTimeChange(suggestedBreak.breakStartTime)
      onBreakEndTimeChange(suggestedBreak.breakEndTime)
    }
  }, [
    disabled,
    hasBreak,
    onHasBreakChange,
    onBreakStartTimeChange,
    onBreakEndTimeChange,
    suggestedBreak,
  ])

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-3.5 transition-all duration-200 sm:p-4",
        hasBreak
          ? "border-amber-500/35 bg-amber-500/10 shadow-2xs"
          : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30 hover:bg-amber-500/8"
      )}
    >
      <div
        className="-m-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-xl p-1.5 transition-colors select-none"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
            return
          }
          handleToggle()
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl shadow-2xs transition-colors",
              hasBreak
                ? "bg-amber-500/25 text-foreground"
                : "bg-amber-500/15 text-foreground"
            )}
          >
            <Coffee className="size-4.5 text-foreground" />
          </div>
          <label
            htmlFor={`${idPrefix}-has-break`}
            className="pointer-events-none cursor-pointer text-sm font-semibold text-foreground"
          >
            {t("form.hasBreakLabel")}
          </label>
        </div>
        <Checkbox
          id={`${idPrefix}-has-break`}
          checked={hasBreak}
          onCheckedChange={(checked) => {
            const isChecked = Boolean(checked)
            onHasBreakChange(isChecked)
            if (isChecked) {
              onBreakStartTimeChange(suggestedBreak.breakStartTime)
              onBreakEndTimeChange(suggestedBreak.breakEndTime)
            }
          }}
          disabled={disabled}
        />
      </div>

      {hasBreak && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Field data-invalid={Boolean(errors?.breakStartTime)}>
              <FieldLabel htmlFor={`${idPrefix}-break-start`}>
                {t("form.breakStartTimeLabel")}
              </FieldLabel>
              <TimePicker
                id={`${idPrefix}-break-start`}
                value={breakStartTime}
                onChange={(val) => onBreakStartTimeChange(val ?? "")}
                disabled={disabled}
                data-invalid={Boolean(errors?.breakStartTime)}
              />
              {errors?.breakStartTime && (
                <FieldError>{errors.breakStartTime.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={Boolean(errors?.breakEndTime)}>
              <FieldLabel htmlFor={`${idPrefix}-break-end`}>
                {t("form.breakEndTimeLabel")}
              </FieldLabel>
              <TimePicker
                id={`${idPrefix}-break-end`}
                value={breakEndTime}
                onChange={(val) => onBreakEndTimeChange(val ?? "")}
                disabled={disabled}
                data-invalid={Boolean(errors?.breakEndTime)}
              />
              {errors?.breakEndTime && (
                <FieldError>{errors.breakEndTime.message}</FieldError>
              )}
            </Field>
          </div>

          {/* Smart Suggestion Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="size-3.5 text-muted-foreground" />
              <span>
                {t("form.suggestedBreakHint", {
                  start: suggestedBreak.breakStartTime,
                  end: suggestedBreak.breakEndTime,
                  duration: suggestedBreak.breakDurationMinutes,
                })}
              </span>
            </div>
            {(breakStartTime !== suggestedBreak.breakStartTime ||
              breakEndTime !== suggestedBreak.breakEndTime) && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={() => {
                  onBreakStartTimeChange(suggestedBreak.breakStartTime)
                  onBreakEndTimeChange(suggestedBreak.breakEndTime)
                }}
                className="h-7 text-xs"
              >
                {t("form.applySuggestedBreak")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
