"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller, useWatch } from "react-hook-form"
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
  calculatePhaseSlots,
  suggestPhaseBreakWindow,
  type OperatingPhaseWithSlots,
  type WeekDay,
} from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"
import { MonthsSelector } from "../months-selector"
import { PhaseSlotsReview } from "../phase-slots-review"
import { PhaseRemainderWarning } from "../phase-remainder-warning"
import { PhaseBreakSection } from "../phase-break-section"
import {
  useUpdateOperatingPhaseSchema,
  type UpdateOperatingPhaseInput,
} from "../../hooks/use-operating-phase-schemas"

export interface EditOperatingPhaseModalProps {
  phase: OperatingPhaseWithSlots | null
  open: boolean
  onClose: () => void
}

const EMPTY_VALUES: UpdateOperatingPhaseInput = {
  title: "",
  months: [],
  startTime: "15:00",
  endTime: "21:00",
  slotDurationMinutes: 90,
  daysOfWeek: [],
  hasBreak: false,
  breakStartTime: "18:00",
  breakEndTime: "19:00",
  isActive: true,
  order: 0,
}

export function EditOperatingPhaseModal({
  phase,
  open,
  onClose,
}: EditOperatingPhaseModalProps) {
  const t = useTranslations("operating-phases")
  const queryClient = useQueryClient()
  const updateSchema = useUpdateOperatingPhaseSchema()

  const [step, setStep] = React.useState<"form" | "review">("form")
  const formValues = React.useMemo<UpdateOperatingPhaseInput>(
    () =>
      phase
        ? {
            title: phase.title,
            months: phase.months,
            startTime: phase.startTime,
            endTime: phase.endTime,
            slotDurationMinutes: phase.slotDurationMinutes,
            daysOfWeek: phase.daysOfWeek as WeekDay[],
            hasBreak: phase.hasBreak ?? false,
            breakStartTime: phase.breakStartTime || "18:00",
            breakEndTime: phase.breakEndTime || "19:00",
            isActive: phase.isActive,
            order: phase.order,
          }
        : EMPTY_VALUES,
    [phase]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<UpdateOperatingPhaseInput>({
    resolver: zodResolver(updateSchema),
    defaultValues: EMPTY_VALUES,
    values: formValues,
  })

  const handleClose = React.useCallback(() => {
    setStep("form")
    reset(formValues)
    onClose()
  }, [formValues, onClose, reset])

  const watchedTitle = useWatch({ control, name: "title" })
  const watchedMonths = useWatch({ control, name: "months" })
  const watchedStartTime = useWatch({ control, name: "startTime" })
  const watchedEndTime = useWatch({ control, name: "endTime" })
  const watchedDuration = useWatch({ control, name: "slotDurationMinutes" })
  const watchedHasBreak = useWatch({ control, name: "hasBreak" })
  const watchedBreakStartTime = useWatch({ control, name: "breakStartTime" })
  const watchedBreakEndTime = useWatch({ control, name: "breakEndTime" })

  const suggestedBreak = React.useMemo(() => {
    return suggestPhaseBreakWindow(
      watchedStartTime || phase?.startTime || "15:00",
      watchedEndTime || phase?.endTime || "21:00",
      Number(watchedDuration) || phase?.slotDurationMinutes || 90,
      60
    )
  }, [
    watchedStartTime,
    watchedEndTime,
    watchedDuration,
    phase?.startTime,
    phase?.endTime,
    phase?.slotDurationMinutes,
  ])

  const liveCalculation = React.useMemo(() => {
    const hasBreak =
      watchedHasBreak !== undefined ? watchedHasBreak : Boolean(phase?.hasBreak)
    const breakStartTime =
      watchedBreakStartTime || phase?.breakStartTime || "18:00"
    const breakEndTime = watchedBreakEndTime || phase?.breakEndTime || "19:00"

    return calculatePhaseSlots(
      watchedStartTime || phase?.startTime || "15:00",
      watchedEndTime || phase?.endTime || "21:00",
      Number(watchedDuration) || phase?.slotDurationMinutes || 90,
      {
        hasBreak,
        breakStartTime,
        breakEndTime,
      }
    )
  }, [
    watchedStartTime,
    watchedEndTime,
    watchedDuration,
    watchedHasBreak,
    watchedBreakStartTime,
    watchedBreakEndTime,
    phase,
  ])

  const updateMutation = useMutation({
    ...operatingPhasesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("notifications.updated"))
      queryClient.invalidateQueries({
        queryKey: operatingPhasesResource.list.baseKey(),
      })
      handleClose()
    },
  })

  const onFormSubmit = () => {
    setStep("review")
  }

  const onConfirmUpdate = () => {
    if (!phase) return
    const values = getValues()
    updateMutation.mutate({
      id: phase.id,
      body: {
        ...values,
        slotDurationMinutes: Number(values.slotDurationMinutes) || 90,
        hasBreak: values.hasBreak,
        breakStartTime: values.hasBreak ? values.breakStartTime : null,
        breakEndTime: values.hasBreak ? values.breakEndTime : null,
      },
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>
            {step === "form" ? t("editPhase") : t("review.title")}
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
                <FieldLabel htmlFor="edit-phase-title">
                  {t("form.titleLabel")}
                </FieldLabel>
                <Input
                  id="edit-phase-title"
                  placeholder={t("form.titlePlaceholder")}
                  {...register("title")}
                  disabled={updateMutation.isPending}
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
                      updateMutation.isPending ||
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
                      value={field.value || []}
                      onChange={(nextMonths) => {
                        field.onChange(nextMonths)
                        if (nextMonths.length > 0) {
                          clearErrors("months")
                        } else {
                          trigger("months")
                        }
                      }}
                      disabled={updateMutation.isPending}
                      hasError={Boolean(errors.months)}
                    />
                  )}
                />
              </Field>

              {/* Times and Duration Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="edit-phase-start-time">
                    {t("form.startTimeLabel")}
                  </FieldLabel>
                  <Input
                    id="edit-phase-start-time"
                    type="time"
                    {...register("startTime")}
                    disabled={updateMutation.isPending}
                    className="text-center"
                  />
                  {errors.startTime && (
                    <FieldError>{errors.startTime.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-phase-end-time">
                    {t("form.endTimeLabel")}
                  </FieldLabel>
                  <Input
                    id="edit-phase-end-time"
                    type="time"
                    {...register("endTime")}
                    disabled={updateMutation.isPending}
                    className="text-center"
                  />
                  {errors.endTime && (
                    <FieldError>{errors.endTime.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-phase-duration">
                    {t("form.durationLabel")}
                  </FieldLabel>
                  <Input
                    id="edit-phase-duration"
                    type="number"
                    min={15}
                    max={240}
                    {...register("slotDurationMinutes", {
                      valueAsNumber: true,
                    })}
                    disabled={updateMutation.isPending}
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
                idPrefix="edit-phase"
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
                disabled={updateMutation.isPending}
              />

              {/* Remainder Warning (Extra Unused Time) */}
              <PhaseRemainderWarning
                calculation={liveCalculation}
                slotDurationMinutes={
                  Number(watchedDuration) || phase?.slotDurationMinutes || 90
                }
              />
            </div>

            <FormDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateMutation.isPending}
              >
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Spinner className="size-4" />
                ) : (
                  <span>{t("form.saveChanges")}</span>
                )}
              </Button>
            </FormDialogFooter>
          </form>
        ) : (
          <PhaseSlotsReview
            title={watchedTitle || phase?.title || t("review.phaseInfo")}
            months={watchedMonths || phase?.months || []}
            startTime={watchedStartTime || phase?.startTime || "15:00"}
            endTime={watchedEndTime || phase?.endTime || "21:00"}
            slotDurationMinutes={
              Number(watchedDuration) || phase?.slotDurationMinutes || 90
            }
            hasBreak={watchedHasBreak}
            breakStartTime={watchedBreakStartTime}
            breakEndTime={watchedBreakEndTime}
            calculation={liveCalculation}
            onEditAgain={() => setStep("form")}
            onConfirm={onConfirmUpdate}
            isSubmitting={updateMutation.isPending}
            confirmText={t("review.confirmAndUpdate")}
          />
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
