"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateUserSchema,
  createUpdateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@workspace/types"

export function useCreateUserSchema() {
  const t = useTranslations("users")

  return React.useMemo(
    () =>
      createCreateUserSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
        passwordMin: t("validation.passwordMin"),
      }),
    [t]
  )
}

export function useUpdateUserSchema() {
  const t = useTranslations("users")

  return React.useMemo(
    () =>
      createUpdateUserSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
      }),
    [t]
  )
}

export type { CreateUserInput, UpdateUserInput }
