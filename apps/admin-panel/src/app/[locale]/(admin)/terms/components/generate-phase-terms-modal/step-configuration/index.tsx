"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"

export interface StepConfigurationProps {
  phaseOptions: ComboboxOption[]
  activePhaseId: string
  onPhaseChange: (phaseId: string) => void
  jalaliYear: number
  onJalaliYearChange: (year: number) => void
  daysPerTerm: number
  onDaysPerTermChange: (days: number) => void
  gapDays: number
  onGapDaysChange: (gap: number) => void
}

export function StepConfiguration({
  phaseOptions,
  activePhaseId,
  onPhaseChange,
  jalaliYear,
  onJalaliYearChange,
  daysPerTerm,
  onDaysPerTermChange,
  gapDays,
  onGapDaysChange,
}: StepConfigurationProps) {
  const t = useTranslations("terms")

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
          <FieldLabel>{t("batchModal.daysPerTerm")}</FieldLabel>
          <Input
            type="number"
            min={1}
            max={365}
            value={daysPerTerm}
            onChange={(e) => {
              onDaysPerTermChange(Number(e.target.value) || 45)
            }}
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
    </div>
  )
}
