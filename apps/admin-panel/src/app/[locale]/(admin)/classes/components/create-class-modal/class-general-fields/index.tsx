"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import type { CreateClassInput } from "../../../hooks/use-class-schemas"

export interface ClassGeneralFieldsProps {
  register: UseFormRegister<CreateClassInput>
  control: Control<CreateClassInput>
  errors: FieldErrors<CreateClassInput>
  termOptions: ComboboxOption[]
  courseOptions: ComboboxOption[]
}

export function ClassGeneralFields({
  register,
  control,
  errors,
  termOptions,
  courseOptions,
}: ClassGeneralFieldsProps) {
  const t = useTranslations("classes")

  return (
    <>
      {/* Title */}
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel>{t("createModal.classTitle")}</FieldLabel>
        <Input
          {...register("title")}
          placeholder={t("createModal.titlePlaceholder")}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Term */}
        <Field data-invalid={Boolean(errors.termId)}>
          <FieldLabel>{t("createModal.term")}</FieldLabel>
          <Controller
            control={control}
            name="termId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={termOptions}
                value={field.value}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("createModal.term")}
                drawerTitle={t("createModal.term")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.termId?.message}</FieldError>
        </Field>

        {/* Course */}
        <Field data-invalid={Boolean(errors.courseId)}>
          <FieldLabel>{t("createModal.course")}</FieldLabel>
          <Controller
            control={control}
            name="courseId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={courseOptions}
                value={field.value}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("createModal.course")}
                drawerTitle={t("createModal.course")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.courseId?.message}</FieldError>
        </Field>
      </div>
    </>
  )
}
