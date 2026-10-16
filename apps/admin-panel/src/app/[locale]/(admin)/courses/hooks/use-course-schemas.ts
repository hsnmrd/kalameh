"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateCourseSchema,
  createUpdateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@workspace/types"

export type { CreateCourseInput, UpdateCourseInput }

export function useCreateCourseSchema() {
  const t = useTranslations("courses")
  return React.useMemo(() => {
    return createCreateCourseSchema({
      titleMin: t("validation.titleMin"),
      baseFeeMin: t("validation.baseFeeMin"),
    })
  }, [t])
}

export function useUpdateCourseSchema() {
  const t = useTranslations("courses")
  return React.useMemo(() => {
    return createUpdateCourseSchema({
      titleMin: t("validation.titleMin"),
      baseFeeMin: t("validation.baseFeeMin"),
    })
  }, [t])
}
