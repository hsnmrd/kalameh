"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { DateInput } from "@workspace/ui/components/date-input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import type { SupportedLocale } from "@workspace/types"
import type { CreateStudentInput } from "../../../hooks/use-student-schemas"

interface ProfileFieldsProps {
  form: UseFormReturn<CreateStudentInput>
  locale: SupportedLocale
  genderOptions: ComboboxOption[]
  courseOptions: ComboboxOption[]
}

export function ProfileFields({
  form,
  locale,
  genderOptions,
  courseOptions,
}: ProfileFieldsProps) {
  const t = useTranslations("students")
  const {
    control,
    register,
    formState: { errors },
  } = form

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.fatherName)}>
          <FieldLabel>{t("createModal.fatherName")}</FieldLabel>
          <Input
            {...register("fatherName")}
            placeholder={t("createModal.fatherNamePlaceholder")}
          />
          <FieldError>{errors.fatherName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.emergencyPhone)}>
          <FieldLabel>{t("createModal.emergencyPhone")}</FieldLabel>
          <Input
            type="tel"
            dir="ltr"
            {...register("emergencyPhone")}
            className="text-start font-mono"
            placeholder={t("createModal.emergencyPhonePlaceholder")}
          />
          <FieldError>{errors.emergencyPhone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.gender)}>
          <FieldLabel>{t("createModal.gender")}</FieldLabel>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <ResponsiveCombobox
                items={genderOptions}
                value={field.value || undefined}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("createModal.genderSelect")}
                drawerTitle={t("createModal.gender")}
                searchable={false}
                data-invalid={Boolean(errors.gender)}
              />
            )}
          />
          <FieldError>{errors.gender?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.birthDate)}>
          <FieldLabel>{t("createModal.birthDate")}</FieldLabel>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DateInput
                value={field.value || undefined}
                onChange={(val) => field.onChange(val || "")}
                locale={locale}
                placeholderYear={locale === "fa" ? "۱۳۸۰" : "YYYY"}
                placeholderMonth={locale === "fa" ? "ماه" : "MM"}
                placeholderDay={locale === "fa" ? "روز" : "DD"}
                data-invalid={Boolean(errors.birthDate)}
              />
            )}
          />
          <FieldError>{errors.birthDate?.message}</FieldError>
        </Field>
        <div className="col-span-1 sm:col-span-2">
          <Field data-invalid={Boolean(errors.address)}>
            <FieldLabel>{t("createModal.address")}</FieldLabel>
            <Input
              {...register("address")}
              placeholder={t("createModal.addressPlaceholder")}
            />
            <FieldError>{errors.address?.message}</FieldError>
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.currentAllowedCourseId)}>
          <FieldLabel>{t("createModal.currentAllowedCourseId")}</FieldLabel>
          <Controller
            control={control}
            name="currentAllowedCourseId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={courseOptions}
                value={field.value || "ROOT"}
                onValueChange={(val) =>
                  field.onChange(val === "ROOT" ? null : val || null)
                }
                placeholder={t("createModal.selectCourse")}
                drawerTitle={t("createModal.currentAllowedCourseId")}
                clearable={false}
                data-invalid={Boolean(errors.currentAllowedCourseId)}
              />
            )}
          />
          <FieldError>{errors.currentAllowedCourseId?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="new-student-password">
            {t("createModal.password")}
          </FieldLabel>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordInput
                {...field}
                id="new-student-password"
                name="new-student-password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder={t("createModal.passwordPlaceholder")}
              />
            )}
          />
          <FieldDescription>{t("createModal.passwordHint")}</FieldDescription>
          <FieldError>{errors.password?.message}</FieldError>
        </Field>
      </div>
    </>
  )
}
