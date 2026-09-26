"use client"

import { useTranslations } from "next-intl"
import type { UseFormReturn } from "react-hook-form"
import { RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import type {
  calculatePhaseSlots,
  suggestPhaseBreakWindow,
} from "@workspace/types"
import type { UpdateOperatingPhaseInput } from "../../../hooks/use-operating-phase-schemas"
import { MonthsSelector } from "../../months-selector"
import { PhaseBreakSection } from "../../phase-break-section"
import { PhaseRemainderWarning } from "../../phase-remainder-warning"

interface FormStepProps {
  form: UseFormReturn<UpdateOperatingPhaseInput>
  months: number[] | undefined
  hasBreak: boolean | undefined
  breakStartTime: string | null | undefined
  breakEndTime: string | null | undefined
  duration: number | undefined
  suggestedBreak: ReturnType<typeof suggestPhaseBreakWindow>
  calculation: ReturnType<typeof calculatePhaseSlots>
  isPending: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function FormStep({
  form,
  months,
  hasBreak,
  breakStartTime,
  breakEndTime,
  duration,
  suggestedBreak,
  calculation,
  isPending,
  onSubmit,
  onCancel,
}: FormStepProps) {
  const t = useTranslations("operating-phases")
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = form

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <Field>
          <FieldLabel htmlFor="edit-phase-title">
            {t("form.titleLabel")}
          </FieldLabel>
          <Input
            id="edit-phase-title"
            placeholder={t("form.titlePlaceholder")}
            {...register("title")}
            disabled={isPending}
          />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>{t("form.monthsLabel")}</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setValue("months", [], {
                  shouldValidate: true,
                  shouldDirty: true,
                })
                trigger("months")
              }}
              disabled={isPending || !months?.length}
              className="h-auto cursor-pointer gap-1 p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
            >
              <RotateCcw className="size-3 text-muted-foreground" />
              <span>{t("form.clearMonths")}</span>
            </Button>
          </div>
          <MonthsSelector
            value={months ?? []}
            onChange={(nextMonths) => {
              setValue("months", nextMonths, {
                shouldValidate: true,
                shouldDirty: true,
              })
              if (nextMonths.length > 0) clearErrors("months")
              else trigger("months")
            }}
            disabled={isPending}
            hasError={Boolean(errors.months)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(["startTime", "endTime"] as const).map((name) => (
            <Field key={name}>
              <FieldLabel htmlFor={`edit-phase-${name}`}>
                {t(`form.${name}Label`)}
              </FieldLabel>
              <Input
                id={`edit-phase-${name}`}
                type="time"
                {...register(name)}
                disabled={isPending}
                className="text-center"
              />
              {errors[name] && <FieldError>{errors[name]?.message}</FieldError>}
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor="edit-phase-duration">
              {t("form.durationLabel")}
            </FieldLabel>
            <Input
              id="edit-phase-duration"
              type="number"
              min={15}
              max={240}
              {...register("slotDurationMinutes", { valueAsNumber: true })}
              disabled={isPending}
              className="text-center"
            />
            {errors.slotDurationMinutes && (
              <FieldError>{errors.slotDurationMinutes.message}</FieldError>
            )}
          </Field>
        </div>

        <PhaseBreakSection
          idPrefix="edit-phase"
          hasBreak={Boolean(hasBreak)}
          onHasBreakChange={(value) =>
            setValue("hasBreak", value, { shouldValidate: true })
          }
          breakStartTime={breakStartTime}
          onBreakStartTimeChange={(value) =>
            setValue("breakStartTime", value, { shouldValidate: true })
          }
          breakEndTime={breakEndTime}
          onBreakEndTimeChange={(value) =>
            setValue("breakEndTime", value, { shouldValidate: true })
          }
          suggestedBreak={suggestedBreak}
          errors={errors}
          disabled={isPending}
        />
        <PhaseRemainderWarning
          calculation={calculation}
          slotDurationMinutes={Number(duration) || 90}
        />
      </div>

      <FormDialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <span>{t("form.saveChanges")}</span>
          )}
        </Button>
      </FormDialogFooter>
    </form>
  )
}
