"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles, Wand2 } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
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
      {/* Configuration Card */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6">
        <div className="flex items-start gap-3.5 border-b border-border/80 pb-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              {t("batchModal.title")}
            </h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t("batchModal.description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
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
            <div className="relative w-full">
              <Input
                type="number"
                min={1400}
                max={1500}
                value={jalaliYear}
                onChange={(e) => {
                  onJalaliYearChange(Number(e.target.value) || jalaliYear)
                }}
                className="pe-16"
              />
              <span
                className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 font-sans text-xs font-normal text-muted-foreground select-none sm:text-sm"
                aria-hidden="true"
              >
                {t("batchModal.jalaliYearUnit")}
              </span>
            </div>
          </Field>

          {/* Row 2: Sessions Per Term and Gap Days */}
          <Field>
            <FieldLabel>{t("batchModal.sessionsPerTerm")}</FieldLabel>
            <Input
              type="number"
              min={1}
              max={100}
              value={currentSessions}
              onChange={(e) => {
                const val = Number(e.target.value) || 18
                onSessionsPerTermChange?.(val)
                onDaysPerTermChange?.(val)
              }}
              placeholder={t("batchModal.sessionsPlaceholder")}
            />
          </Field>

          <Field>
            <FieldLabel>{t("batchModal.gapDays")}</FieldLabel>
            <div className="relative w-full">
              <Input
                type="number"
                min={0}
                max={30}
                value={gapDays}
                onChange={(e) => {
                  onGapDaysChange(Number(e.target.value) || 0)
                }}
                className="pe-14"
              />
              <span
                className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 font-sans text-xs font-normal text-muted-foreground select-none sm:text-sm"
                aria-hidden="true"
              >
                {t("batchModal.gapDaysUnit")}
              </span>
            </div>
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
