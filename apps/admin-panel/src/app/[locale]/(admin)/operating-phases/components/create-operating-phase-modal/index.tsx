"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { RotateCcw } from "lucide-react"
import {
  JALALI_MONTHS,
  calculatePhaseSlots,
  suggestPhaseBreakWindow,
} from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { MonthsSelector } from "../months-selector"
import { PhaseSlotsReview } from "../phase-slots-review"
import { PhaseRemainderWarning } from "../phase-remainder-warning"
import { PhaseBreakSection } from "../phase-break-section"
import {
  useCreateOperatingPhaseSchema,
  type CreateOperatingPhaseInput,
} from "../../hooks/use-operating-phase-schemas"

export interface CreateOperatingPhaseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateOperatingPhaseModal({
  open,
  onClose,
}: CreateOperatingPhaseModalProps) {
  const t = useTranslations("operating-phases")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createSchema = useCreateOperatingPhaseSchema()

  const [step, setStep] = React.useState<"form" | "review">("form")

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<CreateOperatingPhaseInput>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
      startTime: "15:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: [
        "SATURDAY",
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
      ],
      hasBreak: false,
      breakStartTime: "18:00",
      breakEndTime: "19:00",
      isActive: true,
      order: 0,
    },
  })

  const watchedTitle = watch("title")
  const watchedMonths = watch("months")
  const watchedStartTime = watch("startTime")
  const watchedEndTime = watch("endTime")
  const watchedDuration = watch("slotDurationMinutes")
  const watchedHasBreak = watch("hasBreak")
  const watchedBreakStartTime = watch("breakStartTime")
  const watchedBreakEndTime = watch("breakEndTime")

  const suggestedBreak = React.useMemo(() => {
    return suggestPhaseBreakWindow(
      watchedStartTime || "15:00",
      watchedEndTime || "21:00",
      Number(watchedDuration) || 90,
      60
    )
  }, [watchedStartTime, watchedEndTime, watchedDuration])

  const liveCalculation = React.useMemo(() => {
    return calculatePhaseSlots(
      watchedStartTime || "15:00",
      watchedEndTime || "21:00",
      Number(watchedDuration) || 90,
      {
        hasBreak: watchedHasBreak,
        breakStartTime: watchedBreakStartTime,
        breakEndTime: watchedBreakEndTime,
      }
    )
  }, [
    watchedStartTime,
    watchedEndTime,
    watchedDuration,
    watchedHasBreak,
    watchedBreakStartTime,
    watchedBreakEndTime,
  ])

  React.useEffect(() => {
    if (open) {
      setStep("form")
      reset({
        title: "",
        months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
        startTime: "15:00",
        endTime: "21:00",
        slotDurationMinutes: 90,
        daysOfWeek: [
          "SATURDAY",
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
        ],
        hasBreak: false,
        breakStartTime: "18:00",
        breakEndTime: "19:00",
        isActive: true,
        order: 0,
      })
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...operatingPhasesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("notifications.created"))
      queryClient.invalidateQueries({
        queryKey: operatingPhasesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onFormSubmit = () => {
    setStep("review")
  }

  const onConfirmCreate = () => {
    const values = getValues()
    createMutation.mutate({
      ...values,
      slotDurationMinutes: Number(values.slotDurationMinutes) || 90,
      instituteId: activeInstituteId || undefined,
      hasBreak: values.hasBreak,
      breakStartTime: values.hasBreak ? values.breakStartTime : null,
      breakEndTime: values.hasBreak ? values.breakEndTime : null,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>
            {step === "form" ? t("addPhase") : t("review.title")}
          </FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {step === "form" ? (
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {/* Title */}
              <Field>
                <FieldLabel htmlFor="create-phase-title">
                  {t("form.titleLabel")}
                </FieldLabel>
                <Input
                  id="create-phase-title"
                  placeholder={t("form.titlePlaceholder")}
                  {...register("title")}
                  disabled={createMutation.isPending}
                />
                {errors.title && (
                  <FieldError>{errors.title.message}</FieldError>
                )}
              </Field>

              {/* Months Selection */}
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
                    disabled={
                      createMutation.isPending ||
                      !watchedMonths ||
                      watchedMonths.length === 0
                    }
                    className="h-auto cursor-pointer gap-1 p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                  >
                    <RotateCcw className="size-3 text-muted-foreground" />
                    <span>{t("form.clearMonths")}</span>
                  </Button>
                </div>
                <Controller
                  name="months"
                  control={control}
                  render={({ field }) => (
                    <MonthsSelector
                      value={field.value}
                      onChange={(nextMonths) => {
                        field.onChange(nextMonths)
                        if (nextMonths.length > 0) {
                          clearErrors("months")
                        } else {
                          trigger("months")
                        }
                      }}
                      disabled={createMutation.isPending}
                      hasError={Boolean(errors.months)}
                    />
                  )}
                />
              </Field>

              {/* Times and Duration Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="create-phase-start-time">
                    {t("form.startTimeLabel")}
                  </FieldLabel>
                  <Input
                    id="create-phase-start-time"
                    type="time"
                    {...register("startTime")}
                    disabled={createMutation.isPending}
                    className="text-center"
                  />
                  {errors.startTime && (
                    <FieldError>{errors.startTime.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="create-phase-end-time">
                    {t("form.endTimeLabel")}
                  </FieldLabel>
                  <Input
                    id="create-phase-end-time"
                    type="time"
                    {...register("endTime")}
                    disabled={createMutation.isPending}
                    className="text-center"
                  />
                  {errors.endTime && (
                    <FieldError>{errors.endTime.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="create-phase-duration">
                    {t("form.durationLabel")}
                  </FieldLabel>
                  <Input
                    id="create-phase-duration"
                    type="number"
                    min={15}
                    max={240}
                    {...register("slotDurationMinutes", {
                      valueAsNumber: true,
                    })}
                    disabled={createMutation.isPending}
                    className="text-center"
                  />
                  {errors.slotDurationMinutes && (
                    <FieldError>
                      {errors.slotDurationMinutes.message}
                    </FieldError>
                  )}
                </Field>
              </div>

              {/* Break Window Section */}
              <PhaseBreakSection
                idPrefix="create-phase"
                hasBreak={Boolean(watchedHasBreak)}
                onHasBreakChange={(val) =>
                  setValue("hasBreak", val, { shouldValidate: true })
                }
                breakStartTime={watchedBreakStartTime}
                onBreakStartTimeChange={(val) =>
                  setValue("breakStartTime", val, { shouldValidate: true })
                }
                breakEndTime={watchedBreakEndTime}
                onBreakEndTimeChange={(val) =>
                  setValue("breakEndTime", val, { shouldValidate: true })
                }
                suggestedBreak={suggestedBreak}
                errors={errors}
                disabled={createMutation.isPending}
              />

              {/* Remainder Warning (Extra Unused Time) */}
              <PhaseRemainderWarning
                calculation={liveCalculation}
                slotDurationMinutes={Number(watchedDuration) || 90}
              />
            </div>

            <FormDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <span>{t("form.submit")}</span>
                )}
              </Button>
            </FormDialogFooter>
          </form>
        ) : (
          <PhaseSlotsReview
            title={watchedTitle || t("review.phaseInfo")}
            months={watchedMonths || []}
            startTime={watchedStartTime || "15:00"}
            endTime={watchedEndTime || "21:00"}
            slotDurationMinutes={Number(watchedDuration) || 90}
            hasBreak={watchedHasBreak}
            breakStartTime={watchedBreakStartTime}
            breakEndTime={watchedBreakEndTime}
            calculation={liveCalculation}
            onEditAgain={() => setStep("form")}
            onConfirm={onConfirmCreate}
            isSubmitting={createMutation.isPending}
            confirmText={t("review.confirmAndCreate")}
          />
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
