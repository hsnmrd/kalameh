"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import type { SuggestedPhaseBreakWindow } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 p-3.5 sm:p-4">
      <div
        className="-m-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 transition-colors select-none hover:bg-muted/40"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) {
            return
          }
          handleToggle()
        }}
      >
        <label
          htmlFor={`${idPrefix}-has-break`}
          className="pointer-events-none cursor-pointer text-sm font-semibold text-foreground"
        >
          {t("form.hasBreakLabel")}
        </label>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-break-start`}>
                {t("form.breakStartTimeLabel")}
              </FieldLabel>
              <Input
                id={`${idPrefix}-break-start`}
                type="time"
                value={breakStartTime || ""}
                onChange={(e) => onBreakStartTimeChange(e.target.value)}
                disabled={disabled}
                className="text-center"
              />
              {errors?.breakStartTime && (
                <FieldError>{errors.breakStartTime.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-break-end`}>
                {t("form.breakEndTimeLabel")}
              </FieldLabel>
              <Input
                id={`${idPrefix}-break-end`}
                type="time"
                value={breakEndTime || ""}
                onChange={(e) => onBreakEndTimeChange(e.target.value)}
                disabled={disabled}
                className="text-center"
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
