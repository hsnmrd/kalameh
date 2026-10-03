"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn, useWatch } from "react-hook-form"
import type {
  ClassroomDto,
  UpdateSchedulingProposalInput,
} from "@workspace/types"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { SchedulingProposalDaySelector } from "../scheduling-proposal-day-selector"

interface SchedulingProposalEditFieldsProps {
  form: UseFormReturn<UpdateSchedulingProposalInput>
  teacherOptions: ComboboxOption[]
  branchOptions: ComboboxOption[]
  classroomOptions: ComboboxOption[]
  selectedClassroom?: ClassroomDto
  optionsPending: boolean
}

export function SchedulingProposalEditFields({
  form,
  teacherOptions,
  branchOptions,
  classroomOptions,
  selectedClassroom,
  optionsPending,
}: SchedulingProposalEditFieldsProps) {
  const t = useTranslations("scheduling.proposalEdit")
  const {
    control,
    register,
    formState: { errors },
  } = form
  const [deliveryModeValue, capacity] = useWatch({
    control,
    name: ["deliveryMode", "capacity"],
  })
  const deliveryMode = deliveryModeValue ?? "IN_PERSON"

  return (
    <div className="flex flex-col gap-5">
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel htmlFor="proposal-title">{t("titleField")}</FieldLabel>
        <Input
          id="proposal-title"
          {...register("title")}
          aria-invalid={Boolean(errors.title)}
          placeholder={t("titlePlaceholder")}
        />
        <FieldError>{errors.title && t("validation.title")}</FieldError>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.teacherId)}>
          <FieldLabel>{t("teacher")}</FieldLabel>
          <Controller
            control={control}
            name="teacherId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={teacherOptions}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t("teacherPlaceholder")}
                drawerTitle={t("teacher")}
                emptyMessage={t("noQualifiedTeachers")}
                disabled={optionsPending}
                clearable={false}
                data-invalid={Boolean(errors.teacherId)}
                aria-label={t("teacher")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.teacherId && t("validation.teacher")}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.capacity)}>
          <FieldLabel htmlFor="proposal-capacity">{t("capacity")}</FieldLabel>
          <Input
            id="proposal-capacity"
            type="number"
            min={1}
            {...register("capacity", { valueAsNumber: true })}
            aria-invalid={Boolean(errors.capacity)}
          />
          <FieldError>{errors.capacity && t("validation.capacity")}</FieldError>
        </Field>
      </div>

      <Field data-invalid={Boolean(errors.deliveryMode)}>
        <FieldLabel id="proposal-delivery-label">
          {t("deliveryMode")}
        </FieldLabel>
        <Controller
          control={control}
          name="deliveryMode"
          render={({ field }) => (
            <ToggleGroup
              value={[field.value ?? "IN_PERSON"]}
              onValueChange={(value) => value[0] && field.onChange(value[0])}
              aria-labelledby="proposal-delivery-label"
              className="grid w-full grid-cols-2"
            >
              <ToggleGroupItem
                value="IN_PERSON"
                variant="outline"
                className="h-11"
              >
                {t("deliveryModes.IN_PERSON")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ONLINE"
                variant="outline"
                className="h-11"
              >
                {t("deliveryModes.ONLINE")}
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.branchId)}>
          <FieldLabel>{t("branch")}</FieldLabel>
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={branchOptions}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? null)}
                placeholder={t("branchPlaceholder")}
                drawerTitle={t("branch")}
                disabled={optionsPending}
                data-invalid={Boolean(errors.branchId)}
                aria-label={t("branch")}
                className="w-full"
              />
            )}
          />
        </Field>

        <Field data-invalid={Boolean(errors.classroomId)}>
          <FieldLabel>{t("classroom")}</FieldLabel>
          <Controller
            control={control}
            name="classroomId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={classroomOptions}
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? null)}
                placeholder={
                  deliveryMode === "ONLINE"
                    ? t("onlineClassroom")
                    : t("classroomPlaceholder")
                }
                drawerTitle={t("classroom")}
                disabled={optionsPending || deliveryMode === "ONLINE"}
                clearable={false}
                data-invalid={Boolean(errors.classroomId)}
                aria-label={t("classroom")}
                className="w-full"
              />
            )}
          />
          <FieldError>
            {errors.classroomId &&
              (selectedClassroom &&
              capacity &&
              selectedClassroom.capacity < capacity
                ? t("validation.classroomCapacity")
                : t("validation.classroom"))}
          </FieldError>
        </Field>
      </div>

      <SchedulingProposalDaySelector
        control={control}
        error={errors.daysOfWeek}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.startTime)}>
          <FieldLabel htmlFor="proposal-start-time">
            {t("startTime")}
          </FieldLabel>
          <Input
            id="proposal-start-time"
            type="time"
            {...register("startTime")}
            aria-invalid={Boolean(errors.startTime)}
          />
          <FieldError>{errors.startTime && t("validation.time")}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.endTime)}>
          <FieldLabel htmlFor="proposal-end-time">{t("endTime")}</FieldLabel>
          <Input
            id="proposal-end-time"
            type="time"
            {...register("endTime")}
            aria-invalid={Boolean(errors.endTime)}
          />
          <FieldError>
            {errors.endTime &&
              t(
                errors.endTime.type === "custom"
                  ? "validation.endTime"
                  : "validation.time"
              )}
          </FieldError>
        </Field>
      </div>
    </div>
  )
}
