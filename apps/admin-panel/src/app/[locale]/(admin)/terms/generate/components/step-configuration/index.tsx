"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Wand2 } from "lucide-react"
import { Counter } from "@workspace/ui/components/counter"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import type { WeekDay } from "@workspace/types"

export interface StepConfigurationProps {
  phaseOptions: ComboboxOption[]
  activePhaseId: string
  onPhaseChange: (phaseId: string) => void
  jalaliYear: number
  onJalaliYearChange: (year: number) => void
  sessionsPerTerm?: number
  onSessionsPerTermChange?: (sessions: number) => void
  daysPerTerm?: number
  onDaysPerTermChange?: (days: number) => void
  gapDays: number
  onGapDaysChange: (gap: number) => void
  activeClassPatterns?: WeekDay[][]
  onCancel: () => void
  onProceed: () => void
  isProceedDisabled: boolean
  isProceedLoading: boolean
}

export function StepConfiguration({
  phaseOptions,
  activePhaseId,
  onPhaseChange,
  jalaliYear,
  onJalaliYearChange,
  sessionsPerTerm,
  onSessionsPerTermChange,
  daysPerTerm,
  onDaysPerTermChange,
  gapDays,
  onGapDaysChange,
  onCancel,
  onProceed,
  isProceedDisabled,
  isProceedLoading,
}: StepConfigurationProps) {
  const t = useTranslations("terms")
  const currentSessions = sessionsPerTerm ?? daysPerTerm ?? 18

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Row 1: Phase and Academic Year */}
          <Field>
            <FieldLabel>{t("batchModal.phaseLabel")}</FieldLabel>
            <ResponsiveCombobox
              items={phaseOptions}
              value={activePhaseId}
              onValueChange={(val) => onPhaseChange(val || "")}
              placeholder={t("batchModal.phasePlaceholder")}
              drawerTitle={t("batchModal.phaseLabel")}
              clearable={false}
            />
          </Field>

          <Field>
            <FieldLabel>{t("batchModal.jalaliYear")}</FieldLabel>
            <Counter
              min={1400}
              max={1500}
              value={jalaliYear}
              onValueChange={(val) => onJalaliYearChange(val || jalaliYear)}
              aria-label={t("batchModal.jalaliYear")}
              format={{ useGrouping: false }}
              className="w-full"
            />
          </Field>

          {/* Row 2: Sessions Per Term and Gap Days */}
          <Field>
            <FieldLabel>{t("batchModal.sessionsPerTerm")}</FieldLabel>
            <Counter
              min={1}
              max={100}
              value={currentSessions}
              onValueChange={(val) => {
                const nextVal = val || 18
                onSessionsPerTermChange?.(nextVal)
                onDaysPerTermChange?.(nextVal)
              }}
              aria-label={t("batchModal.sessionsPerTerm")}
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel>{t("batchModal.gapDays")}</FieldLabel>
            <Counter
              min={0}
              max={30}
              value={gapDays}
              onValueChange={(val) => {
                onGapDaysChange(val ?? 0)
              }}
              aria-label={t("batchModal.gapDays")}
              className="w-full"
            />
          </Field>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col-reverse items-center justify-end gap-3 border-t border-border/80 pt-5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {t("batchModal.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isProceedDisabled}
            onClick={onProceed}
            className="w-full sm:w-auto"
          >
            {isProceedLoading ? (
              <Spinner className="size-5 text-primary-foreground" />
            ) : (
              <Wand2 className="size-5 text-primary-foreground" />
            )}
            <span>
              {isProceedLoading
                ? t("batchModal.previewing")
                : t("batchModal.proceedToPreview")}
            </span>
          </Button>
        </div>
      </section>
    </div>
  )
}
