"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateTeacherSchema,
  createUpdateTeacherSchema,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from "@workspace/types"

export function useCreateTeacherSchema() {
  const t = useTranslations("teachers")

  return React.useMemo(
    () =>
      createCreateTeacherSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
        passwordMin: t("validation.passwordMin"),
      }),
    [t]
  )
}

export function useUpdateTeacherSchema() {
  const t = useTranslations("teachers")

  return React.useMemo(
    () =>
      createUpdateTeacherSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
      }),
    [t]
  )
}

export type { CreateTeacherInput, UpdateTeacherInput }
