"use client"

import { useTranslations } from "next-intl"
import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { WEEK_DAYS, type UpdateSchedulingProposalInput } from "@workspace/types"
import {
  Field,
  FieldError as FieldErrorMessage,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

interface SchedulingProposalDaySelectorProps {
  control: Control<UpdateSchedulingProposalInput>
  error?: FieldErrors<UpdateSchedulingProposalInput>["daysOfWeek"]
}

export function SchedulingProposalDaySelector({
  control,
  error,
}: SchedulingProposalDaySelectorProps) {
  const t = useTranslations("scheduling.proposalEdit")

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel id="proposal-days-label">{t("days")}</FieldLabel>
      <Controller
        control={control}
        name="daysOfWeek"
        render={({ field }) => (
          <ToggleGroup
            multiple
            value={field.value ?? []}
            onValueChange={field.onChange}
            aria-labelledby="proposal-days-label"
            aria-invalid={Boolean(error)}
            className="flex w-full flex-wrap justify-start"
          >
            {WEEK_DAYS.map((day) => (
              <ToggleGroupItem
                key={day}
                value={day}
                variant="outline"
                className="min-h-11 flex-1 px-3"
              >
                {t(`weekDays.${day}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      />
      <FieldErrorMessage>{error && t("validation.days")}</FieldErrorMessage>
    </Field>
  )
}
