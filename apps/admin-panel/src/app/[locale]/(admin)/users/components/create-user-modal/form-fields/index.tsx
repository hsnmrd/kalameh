"use client"

import { CheckCircle2, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Spinner } from "@workspace/ui/components/spinner"
import { ROLES, type Role } from "@workspace/types"
import type { CreateUserInput } from "../../../hooks/use-user-schemas"

interface FormFieldsProps {
  form: UseFormReturn<CreateUserInput>
  roleOptions: ComboboxOption[]
  isLookingUp: boolean
  lookupData?: { found: boolean } | null
  shouldQuery: boolean
}

export function FormFields({
  form,
  roleOptions,
  isLookingUp,
  lookupData,
  shouldQuery,
}: FormFieldsProps) {
  const t = useTranslations("users")
  const {
    control,
    register,
    formState: { errors },
  } = form

  return (
    <>
      {isLookingUp && (
        <div className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground">
          <Spinner className="size-3.5 text-muted-foreground" />
          <span>{t("createModal.lookupChecking")}</span>
        </div>
      )}
      {lookupData?.found && !isLookingUp && (
        <div className="flex items-center gap-1.5 py-0.5 text-xs font-medium text-primary">
          <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
          <span>{t("createModal.lookupFound")}</span>
        </div>
      )}
      {shouldQuery && !isLookingUp && lookupData && !lookupData.found && (
        <div className="flex items-center gap-1.5 py-0.5 text-xs text-muted-foreground">
          <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
          <span>{t("createModal.lookupNew")}</span>
        </div>
      )}
      <Field>
        <FieldLabel>{t("createModal.avatar")}</FieldLabel>
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <Attachment
              value={field.value}
              onChange={(file) => field.onChange(file)}
              placeholder={t("createModal.avatarPlaceholder")}
              description={t("createModal.avatarDescription")}
              removeLabel={t("createModal.removeAvatar")}
            />
          )}
        />
      </Field>
      <Field data-invalid={Boolean(errors.nationalCode)}>
        <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          dir="ltr"
          {...register("nationalCode")}
          className="text-start font-mono"
          placeholder={t("createModal.nationalCodePlaceholder")}
        />
        <FieldError>{errors.nationalCode?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.phone)}>
        <FieldLabel htmlFor="new-user-phone">
          {t("createModal.phone")}
        </FieldLabel>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Input
              {...field}
              id="new-user-phone"
              name="new-user-phone"
              type="tel"
              dir="ltr"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              className="text-start font-mono"
              placeholder={t("createModal.phonePlaceholder")}
            />
          )}
        />
        <FieldError>{errors.phone?.message}</FieldError>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field data-invalid={Boolean(errors.firstName)}>
          <FieldLabel>{t("createModal.firstName")}</FieldLabel>
          <Input
            {...register("firstName")}
            placeholder={t("createModal.firstNamePlaceholder")}
          />
          <FieldError>{errors.firstName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.lastName)}>
          <FieldLabel>{t("createModal.lastName")}</FieldLabel>
          <Input
            {...register("lastName")}
            placeholder={t("createModal.lastNamePlaceholder")}
          />
          <FieldError>{errors.lastName?.message}</FieldError>
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.role)}>
        <FieldLabel>{t("createModal.role")}</FieldLabel>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <ResponsiveCombobox
              items={roleOptions}
              value={field.value}
              onValueChange={(val) =>
                field.onChange((val as Role) || ROLES.STUDENT)
              }
              placeholder={t("createModal.role")}
              drawerTitle={t("createModal.role")}
              data-invalid={Boolean(errors.role)}
            />
          )}
        />
        <FieldError>{errors.role?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="new-user-password">
          {t("createModal.password")}
        </FieldLabel>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              {...field}
              id="new-user-password"
              name="new-user-password"
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
    </>
  )
}
