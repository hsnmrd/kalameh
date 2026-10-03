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
        firstNameMin: t("createModal.firstName"),
        lastNameMin: t("createModal.lastName"),
        phoneRegex: t("createModal.phone"),
        passwordMin: t("createModal.password"),
      }),
    [t]
  )
}

export function useUpdateTeacherSchema() {
  const t = useTranslations("teachers")

  return React.useMemo(
    () =>
      createUpdateTeacherSchema({
        firstNameMin: t("createModal.firstName"),
        lastNameMin: t("createModal.lastName"),
        phoneRegex: t("createModal.phone"),
      }),
    [t]
  )
}

export type { CreateTeacherInput, UpdateTeacherInput }
