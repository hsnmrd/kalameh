"use client"

import { CheckCircle2, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import type { CreateStudentInput } from "../../../hooks/use-student-schemas"

interface IdentityFieldsProps {
  form: UseFormReturn<CreateStudentInput>
  isLookingUp: boolean
  lookupData?: { found: boolean } | null
  shouldQuery: boolean
}

export function IdentityFields({
  form,
  isLookingUp,
  lookupData,
  shouldQuery,
}: IdentityFieldsProps) {
  const t = useTranslations("students")
  const {
    control,
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-3">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <FieldDescription>
            {t("createModal.nationalCodeHint")}
          </FieldDescription>
          <FieldError>{errors.nationalCode?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor="new-student-phone">
            {t("createModal.phone")}
          </FieldLabel>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                {...field}
                id="new-student-phone"
                name="new-student-phone"
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
    </div>
  )
}
