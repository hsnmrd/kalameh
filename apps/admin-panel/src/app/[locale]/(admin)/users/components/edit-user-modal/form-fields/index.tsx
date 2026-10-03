"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { ROLES, type Role } from "@workspace/types"
import type { UpdateUserInput } from "../../../hooks/use-user-schemas"

interface FormFieldsProps {
  form: UseFormReturn<UpdateUserInput>
  roleOptions: ComboboxOption[]
  statusOptions: ComboboxOption[]
}

export function FormFields({
  form,
  roleOptions,
  statusOptions,
}: FormFieldsProps) {
  const t = useTranslations("users")
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
      <div className="grid grid-cols-2 gap-3">
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
      </div>
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
        <FieldError>{errors.nationalCode?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.role)}>
        <FieldLabel>{t("createModal.role")}</FieldLabel>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <ResponsiveCombobox
              items={roleOptions}
              value={field.value}
              onValueChange={(value) =>
                field.onChange((value as Role) || ROLES.CLERK)
              }
              placeholder={t("createModal.role")}
              drawerTitle={t("createModal.role")}
              data-invalid={Boolean(errors.role)}
            />
          )}
        />
        <FieldError>{errors.role?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel>{t("editModal.isActive")}</FieldLabel>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <ResponsiveCombobox
              items={statusOptions}
              value={field.value ? "true" : "false"}
              onValueChange={(value) => field.onChange(value === "true")}
              placeholder={t("editModal.isActive")}
              drawerTitle={t("editModal.isActive")}
              searchable={false}
            />
          )}
        />
      </Field>
    </>
  )
}
