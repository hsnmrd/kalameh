"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import type { CreateTeacherInput } from "../../../hooks/use-teacher-schemas"
import { AvailabilityEditor } from "../../availability-editor"

interface FormFieldsProps {
  form: UseFormReturn<CreateTeacherInput>
}

export function FormFields({ form }: FormFieldsProps) {
  const t = useTranslations("teachers")
  const {
    control,
    register,
    formState: { errors },
  } = form
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.firstName)}>
          <FieldLabel>{t("createModal.firstName")}</FieldLabel>
          <Input
            {...register("firstName")}
            placeholder={t("createModal.firstNamePlaceholder")}
            autoComplete="off"
          />
          <FieldError>{errors.firstName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.lastName)}>
          <FieldLabel>{t("createModal.lastName")}</FieldLabel>
          <Input
            {...register("lastName")}
            placeholder={t("createModal.lastNamePlaceholder")}
            autoComplete="off"
          />
          <FieldError>{errors.lastName?.message}</FieldError>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel>{t("createModal.phone")}</FieldLabel>
          <Input
            {...register("phone")}
            placeholder={t("createModal.phonePlaceholder")}
            dir="ltr"
            autoComplete="off"
          />
          <FieldError>{errors.phone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.nationalCode)}>
          <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
          <Input
            {...register("nationalCode")}
            placeholder={t("createModal.nationalCodePlaceholder")}
            dir="ltr"
            autoComplete="off"
          />
          <FieldError>{errors.nationalCode?.message}</FieldError>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.degree)}>
          <FieldLabel>{t("createModal.degree")}</FieldLabel>
          <Input
            {...register("degree")}
            placeholder={t("createModal.degreePlaceholder")}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
          />
          <FieldError>{errors.degree?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="new-teacher-password">
            {t("createModal.password")}
          </FieldLabel>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <PasswordInput
                {...field}
                id="new-teacher-password"
                name="new-teacher-password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                placeholder={t("createModal.passwordPlaceholder")}
                dir="ltr"
              />
            )}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.bio)}>
        <FieldLabel>{t("createModal.bio")}</FieldLabel>
        <Input
          {...register("bio")}
          placeholder={t("createModal.bioPlaceholder")}
          autoComplete="off"
        />
        <FieldError>{errors.bio?.message}</FieldError>
      </Field>
      <Controller
        control={control}
        name="availabilities"
        render={({ field }) => (
          <AvailabilityEditor
            value={field.value || []}
            onChange={field.onChange}
          />
        )}
      />
    </>
  )
}
