"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
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
  activeClassPatterns,
}: StepConfigurationProps) {
  const t = useTranslations("terms")
  const currentSessions = sessionsPerTerm ?? daysPerTerm ?? 18

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {t("batchModal.description")}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
        </div>

        <Field>
          <FieldLabel>{t("batchModal.jalaliYear")}</FieldLabel>
          <Input
            type="number"
            min={1400}
            max={1500}
            value={jalaliYear}
            onChange={(e) => {
              onJalaliYearChange(Number(e.target.value) || jalaliYear)
            }}
          />
        </Field>

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
          <Input
            type="number"
            min={0}
            max={30}
            value={gapDays}
            onChange={(e) => {
              onGapDaysChange(Number(e.target.value) || 0)
            }}
          />
        </Field>
      </div>

      {activeClassPatterns && activeClassPatterns.length > 0 && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-muted/40 p-4">
          <span className="text-xs font-semibold text-foreground">
            {t("batchModal.classPatternsLabel")}
          </span>
          <div className="flex flex-wrap gap-2">
            {activeClassPatterns.map((pattern, idx) => {
              const hasEven =
                pattern.includes("SATURDAY") ||
                pattern.includes("MONDAY") ||
                pattern.includes("WEDNESDAY")
              const hasOdd =
                pattern.includes("SUNDAY") ||
                pattern.includes("TUESDAY") ||
                pattern.includes("THURSDAY")
              const label = hasEven
                ? t("batchModal.patternEven")
                : hasOdd
                  ? t("batchModal.patternOdd")
                  : t("batchModal.patternWeekend")

              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs"
                >
                  <span className="size-2 rounded-full bg-primary" />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
