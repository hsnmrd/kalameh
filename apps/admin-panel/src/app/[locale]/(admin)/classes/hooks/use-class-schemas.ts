"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateClassSchema,
  createUpdateClassSchema,
  type CreateClassInput,
  type UpdateClassInput,
} from "@workspace/types"

export type { CreateClassInput, UpdateClassInput }

export function useCreateClassSchema() {
  const t = useTranslations("classes")
  return React.useMemo(() => {
    return createCreateClassSchema({
      titleMin: t("validation.titleMin"),
      capacityMin: t("validation.capacityMin"),
      feeMin: t("validation.feeMin"),
      termIdRequired: t("validation.termIdRequired"),
      courseIdRequired: t("validation.courseIdRequired"),
    })
  }, [t])
}

export function useUpdateClassSchema() {
  const t = useTranslations("classes")
  return React.useMemo(() => {
    return createUpdateClassSchema({
      titleMin: t("validation.titleMin"),
      capacityMin: t("validation.capacityMin"),
      feeMin: t("validation.feeMin"),
    })
  }, [t])
}
