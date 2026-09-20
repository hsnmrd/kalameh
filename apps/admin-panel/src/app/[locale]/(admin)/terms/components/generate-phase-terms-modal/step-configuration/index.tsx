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
}: StepConfigurationProps) {
  const t = useTranslations("terms")
  const currentSessions = sessionsPerTerm ?? daysPerTerm ?? 18

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
  )
}
