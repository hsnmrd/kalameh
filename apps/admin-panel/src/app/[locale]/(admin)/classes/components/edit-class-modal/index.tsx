"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Controller } from "react-hook-form"
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
import { PriceInput } from "@workspace/ui/components/price-input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ClassDto } from "@workspace/types"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useEditClassForm } from "../../hooks/use-edit-class-form"
import { TermDetailsPreview } from "../term-details-preview"
import { ClassScheduleWizard } from "../class-schedule-wizard"
import { ScheduleDetailsPreview } from "../schedule-details-preview"
import { EditGeneralFields } from "./edit-general-fields"
import { EditLocationFields } from "./edit-location-fields"

export interface EditClassModalProps {
  cls: ClassDto | null
  open: boolean
  onClose: () => void
}

export function EditClassModal({ cls, open, onClose }: EditClassModalProps) {
  const t = useTranslations("classes")

  const {
    form,
    activeInstituteId,
    termOptions,
    courseOptions,
    branchOptions,
    classroomOptions,
    selectedTerm,
    selectedClassroom,
    classCapacity,
    isCapacityExceeded,
    updateMutation,
    onSubmit,
  } = useEditClassForm(cls, open, onClose)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form

  const [isScheduleWizardOpen, setIsScheduleWizardOpen] = React.useState(false)
  const currentSchedule = watch("schedule")

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <EditGeneralFields
              register={register}
              control={control}
              errors={errors}
              termOptions={termOptions}
              courseOptions={courseOptions}
            />

            <TermDetailsPreview term={selectedTerm} />

            <EditLocationFields
              control={control}
              errors={errors}
              branchOptions={branchOptions}
              classroomOptions={classroomOptions}
              selectedClassroom={selectedClassroom}
              classCapacity={classCapacity}
              isCapacityExceeded={isCapacityExceeded}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.capacity)}>
                <FieldLabel>{t("editModal.capacity")}</FieldLabel>
                <Input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                />
                <FieldError>{errors.capacity?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.fee)}>
                <FieldLabel>{t("editModal.fee")}</FieldLabel>
                <Controller
                  control={control}
                  name="fee"
                  render={({ field }) => (
                    <PriceInput
                      value={field.value}
                      onValueChange={(val) => field.onChange(val ?? 0)}
                      placeholder={t("editModal.feePlaceholder")}
                    />
                  )}
                />
                <FieldError>{errors.fee?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.teacherName)}>
                <FieldLabel>{t("editModal.teacherName")}</FieldLabel>
                <Input
                  {...register("teacherName")}
                  placeholder={t("editModal.teacherNamePlaceholder")}
                />
                <FieldError>{errors.teacherName?.message}</FieldError>
              </Field>

              <Field
                data-invalid={Boolean(errors.schedule)}
                className="min-w-0"
              >
                <FieldLabel>{t("editModal.schedule")}</FieldLabel>
                <button
                  type="button"
                  onClick={() => setIsScheduleWizardOpen(true)}
                  className={cn(
                    "flex h-14 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-base shadow-2xs transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
                    errors.schedule &&
                      "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-start text-sm sm:text-base",
                      currentSchedule
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/45"
                    )}
                  >
                    {currentSchedule || t("scheduleWizard.noScheduleSet")}
                  </span>
                  <CalendarIcon className="size-5 shrink-0 text-muted-foreground" />
                </button>
                <FieldError>{errors.schedule?.message}</FieldError>
              </Field>
            </div>

            <ScheduleDetailsPreview
              daysOfWeek={watch("daysOfWeek")}
              sessionDates={watch("sessionDates")}
              startTime={watch("startTime")}
              endTime={watch("endTime")}
              schedule={currentSchedule}
            />
          </div>

          <ClassScheduleWizard
            open={isScheduleWizardOpen}
            onClose={() => setIsScheduleWizardOpen(false)}
            term={selectedTerm}
            instituteId={
              activeInstituteId || selectedTerm?.instituteId || cls?.instituteId
            }
            classroomId={watch("classroomId")}
            teacherName={watch("teacherName")}
            excludeClassId={cls?.id}
            initialDaysOfWeek={watch("daysOfWeek") || []}
            initialSessionDates={watch("sessionDates") || []}
            initialStartTime={watch("startTime")}
            initialEndTime={watch("endTime")}
            onConfirm={(data) => {
              setValue("daysOfWeek", data.daysOfWeek)
              setValue("sessionDates", data.sessionDates)
              setValue("startTime", data.startTime)
              setValue("endTime", data.endTime)
              setValue("schedule", data.formattedSchedule, {
                shouldValidate: true,
              })
            }}
          />

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
