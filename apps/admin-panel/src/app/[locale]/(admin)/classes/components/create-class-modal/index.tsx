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
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateClassForm } from "../../hooks/use-create-class-form"
import { TermDetailsPreview } from "../term-details-preview"
import { ClassScheduleWizard } from "../class-schedule-wizard"
import { ScheduleDetailsPreview } from "../schedule-details-preview"
import { ClassGeneralFields } from "./class-general-fields"
import { ClassLocationFields } from "./class-location-fields"

export interface CreateClassModalProps {
  open: boolean
  onClose: () => void
}

export function CreateClassModal({ open, onClose }: CreateClassModalProps) {
  const t = useTranslations("classes")

  const {
    form,
    activeInstituteId,
    termOptions,
    courseOptions,
    branchOptions,
    teacherOptions,
    teachers,
    classroomOptions,
    filteredClassrooms,
    selectedTerm,
    selectedClassroom,
    classCapacity,
    isCapacityExceeded,
    createMutation,
    onSubmit,
  } = useCreateClassForm(open, onClose)

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
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <ClassGeneralFields
              register={register}
              control={control}
              errors={errors}
              termOptions={termOptions}
              courseOptions={courseOptions}
            />

            <TermDetailsPreview term={selectedTerm} />

            <ClassLocationFields
              control={control}
              errors={errors}
              branchOptions={branchOptions}
              classroomOptions={classroomOptions}
              classrooms={filteredClassrooms}
              selectedClassroom={selectedClassroom}
              classCapacity={classCapacity}
              isCapacityExceeded={isCapacityExceeded}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.capacity)}>
                <FieldLabel>{t("createModal.capacity")}</FieldLabel>
                <Input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                />
                <FieldError>{errors.capacity?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.fee)}>
                <FieldLabel>{t("createModal.fee")}</FieldLabel>
                <Controller
                  control={control}
                  name="fee"
                  render={({ field }) => (
                    <PriceInput
                      value={field.value}
                      onValueChange={(val) => field.onChange(val ?? 0)}
                      placeholder={t("createModal.feePlaceholder")}
                    />
                  )}
                />
                <FieldError>{errors.fee?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                data-invalid={Boolean(errors.teacherName || errors.teacherId)}
              >
                <FieldLabel>{t("createModal.teacherName")}</FieldLabel>
                <Controller
                  control={control}
                  name="teacherId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={teacherOptions}
                      value={field.value || ""}
                      onValueChange={(val) => {
                        field.onChange(val || null)
                        const found = teachers.find((tch) => tch.id === val)
                        if (found) {
                          setValue(
                            "teacherName",
                            `${found.firstName} ${found.lastName}`
                          )
                        } else if (!val) {
                          setValue("teacherName", "")
                        }
                      }}
                      placeholder={t("createModal.teacherNamePlaceholder")}
                      drawerTitle={t("createModal.teacherName")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>
                  {errors.teacherId?.message || errors.teacherName?.message}
                </FieldError>
              </Field>

              <Field
                data-invalid={Boolean(errors.schedule)}
                className="min-w-0"
              >
                <FieldLabel>{t("createModal.schedule")}</FieldLabel>
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
            instituteId={activeInstituteId || selectedTerm?.instituteId}
            classroomId={watch("classroomId")}
            teacherId={watch("teacherId")}
            teacherName={watch("teacherName")}
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
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
