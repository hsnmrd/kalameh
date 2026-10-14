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
import { PriceInput } from "@workspace/ui/components/price-input"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import type { CreateCourseInput } from "../../../hooks/use-course-schemas"

export interface SingleCourseFormProps {
  register: UseFormRegister<CreateCourseInput>
  control: Control<CreateCourseInput>
  errors: FieldErrors<CreateCourseInput>
  prerequisiteOptions: { value: string; label: string }[]
  bookOptions: { value: string; label: string }[]
}

export function SingleCourseForm({
  register,
  control,
  errors,
  prerequisiteOptions,
  bookOptions,
}: SingleCourseFormProps) {
  const t = useTranslations("courses")

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
      <Field data-invalid={Boolean(errors.title)}>
        <FieldLabel>{t("createModal.courseTitle")}</FieldLabel>
        <Input
          {...register("title")}
          placeholder={t("createModal.titlePlaceholder")}
        />
        <FieldError>{errors.title?.message}</FieldError>
      </Field>

      {bookOptions.length > 1 && (
        <Field>
          <FieldLabel>{t("createModal.book")}</FieldLabel>
          <Controller
            control={control}
            name="bookId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={bookOptions}
                value={field.value || "none"}
                onValueChange={(val) =>
                  field.onChange(val === "none" ? null : val)
                }
                placeholder={t("createModal.none")}
                drawerTitle={t("createModal.book")}
                className="w-full"
              />
            )}
          />
        </Field>
      )}

      <Field data-invalid={Boolean(errors.baseFee)}>
        <FieldLabel>{t("createModal.baseFee")}</FieldLabel>
        <Controller
          control={control}
          name="baseFee"
          render={({ field }) => (
            <PriceInput
              value={field.value}
              onValueChange={(val) => field.onChange(val ?? 0)}
              placeholder={t("createModal.feePlaceholder")}
            />
          )}
        />
        <FieldError>{errors.baseFee?.message}</FieldError>
      </Field>

      <Field>
        <FieldLabel>{t("createModal.prerequisite")}</FieldLabel>
        <Controller
          control={control}
          name="prerequisiteId"
          render={({ field }) => (
            <ResponsiveCombobox
              items={prerequisiteOptions}
              value={field.value || "none"}
              onValueChange={(val) =>
                field.onChange(val === "none" ? null : val)
              }
              placeholder={t("createModal.none")}
              drawerTitle={t("createModal.prerequisite")}
              className="w-full"
            />
          )}
        />
      </Field>
    </div>
  )
}
