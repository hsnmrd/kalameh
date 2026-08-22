"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateStudentSchema,
  createUpdateStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "@workspace/types"

export function useCreateStudentSchema() {
  const t = useTranslations("students")

  return React.useMemo(
    () =>
      createCreateStudentSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
        passwordMin: t("validation.passwordMin"),
      }),
    [t]
  )
}

export function useUpdateStudentSchema() {
  const t = useTranslations("students")

  return React.useMemo(
    () =>
      createUpdateStudentSchema({
        firstNameMin: t("validation.firstNameMin"),
        lastNameMin: t("validation.lastNameMin"),
        phoneRegex: t("validation.phoneRegex"),
      }),
    [t]
  )
}

export type { CreateStudentInput, UpdateStudentInput }
