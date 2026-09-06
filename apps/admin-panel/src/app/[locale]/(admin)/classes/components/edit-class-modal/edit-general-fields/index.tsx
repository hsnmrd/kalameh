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
import type { UpdateClassInput } from "../../../hooks/use-class-schemas"

export interface EditGeneralFieldsProps {
  register: UseFormRegister<UpdateClassInput>
  control: Control<UpdateClassInput>
  errors: FieldErrors<UpdateClassInput>
  termOptions: ComboboxOption[]
  courseOptions: ComboboxOption[]
}

export function EditGeneralFields({
  register,
  control,
  errors,
  termOptions,
  courseOptions,
}: EditGeneralFieldsProps) {
  const t = useTranslations("classes")

  return (
    <>
      {/* Title */}
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel>{t("editModal.classTitle")}</FieldLabel>
        <Input
          {...register("title")}
          placeholder={t("editModal.titlePlaceholder")}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Term */}
        <Field data-invalid={Boolean(errors.termId)}>
          <FieldLabel>{t("editModal.term")}</FieldLabel>
          <Controller
            control={control}
            name="termId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={termOptions}
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("editModal.term")}
                drawerTitle={t("editModal.term")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.termId?.message}</FieldError>
        </Field>

        {/* Course */}
        <Field data-invalid={Boolean(errors.courseId)}>
          <FieldLabel>{t("editModal.course")}</FieldLabel>
          <Controller
            control={control}
            name="courseId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={courseOptions}
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("editModal.course")}
                drawerTitle={t("editModal.course")}
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
