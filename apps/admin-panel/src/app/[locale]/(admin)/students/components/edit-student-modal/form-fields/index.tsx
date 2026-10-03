"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { DateInput } from "@workspace/ui/components/date-input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import type { SupportedLocale } from "@workspace/types"
import type { UpdateStudentInput } from "../../../hooks/use-student-schemas"

interface FormFieldsProps {
  form: UseFormReturn<UpdateStudentInput>
  locale: SupportedLocale
  genderOptions: ComboboxOption[]
  courseOptions: ComboboxOption[]
  statusOptions: ComboboxOption[]
}

export function FormFields({
  form,
  locale,
  genderOptions,
  courseOptions,
  statusOptions,
}: FormFieldsProps) {
  const t = useTranslations("students")
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form
  const avatarUrl = watch("avatarUrl")

  return (
    <>
      <Field>
        <FieldLabel>{t("editModal.avatar")}</FieldLabel>
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <Attachment
              value={
                field.value || (avatarUrl ? getAssetUrl(avatarUrl) : undefined)
              }
              onChange={(file) => {
                field.onChange(file)
                if (!file) setValue("avatarUrl", null, { shouldDirty: true })
              }}
              placeholder={t("createModal.avatarPlaceholder")}
              description={t("createModal.avatarDescription")}
              removeLabel={t("createModal.removeAvatar")}
            />
          )}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.firstName)}>
          <FieldLabel>{t("editModal.firstName")}</FieldLabel>
          <Input {...register("firstName")} />
          <FieldError>{errors.firstName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.lastName)}>
          <FieldLabel>{t("editModal.lastName")}</FieldLabel>
          <Input {...register("lastName")} />
          <FieldError>{errors.lastName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel>{t("editModal.phone")}</FieldLabel>
          <Input
            type="tel"
            dir="ltr"
            {...register("phone")}
            className="text-start font-mono"
          />
          <FieldError>{errors.phone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.nationalCode)}>
          <FieldLabel>{t("editModal.nationalCode")}</FieldLabel>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            dir="ltr"
            {...register("nationalCode")}
            className="text-start font-mono"
          />
          <FieldDescription>{t("editModal.nationalCodeHint")}</FieldDescription>
          <FieldError>{errors.nationalCode?.message}</FieldError>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.fatherName)}>
          <FieldLabel>{t("editModal.fatherName")}</FieldLabel>
          <Input {...register("fatherName")} />
          <FieldError>{errors.fatherName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.emergencyPhone)}>
          <FieldLabel>{t("editModal.emergencyPhone")}</FieldLabel>
          <Input
            type="tel"
            dir="ltr"
            {...register("emergencyPhone")}
            className="text-start font-mono"
          />
          <FieldError>{errors.emergencyPhone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.gender)}>
          <FieldLabel>{t("editModal.gender")}</FieldLabel>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <ResponsiveCombobox
                items={genderOptions}
                value={field.value || undefined}
                onValueChange={(val) => field.onChange(val || "")}
                placeholder={t("createModal.genderSelect")}
                drawerTitle={t("editModal.gender")}
                searchable={false}
                data-invalid={Boolean(errors.gender)}
              />
            )}
          />
          <FieldError>{errors.gender?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.birthDate)}>
          <FieldLabel>{t("editModal.birthDate")}</FieldLabel>
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
            <FieldLabel>{t("editModal.address")}</FieldLabel>
            <Input {...register("address")} />
            <FieldError>{errors.address?.message}</FieldError>
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.currentAllowedCourseId)}>
          <FieldLabel>{t("editModal.currentAllowedCourseId")}</FieldLabel>
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
                drawerTitle={t("editModal.currentAllowedCourseId")}
                clearable={false}
                data-invalid={Boolean(errors.currentAllowedCourseId)}
              />
            )}
          />
          <FieldError>{errors.currentAllowedCourseId?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.isActive)}>
          <FieldLabel>{t("editModal.isActive")}</FieldLabel>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <ResponsiveCombobox
                items={statusOptions}
                value={field.value ? "ACTIVE" : "INACTIVE"}
                onValueChange={(val) => field.onChange(val === "ACTIVE")}
                drawerTitle={t("editModal.isActive")}
                searchable={false}
                clearable={false}
                data-invalid={Boolean(errors.isActive)}
              />
            )}
          />
          <FieldError>{errors.isActive?.message}</FieldError>
        </Field>
      </div>
    </>
  )
}
