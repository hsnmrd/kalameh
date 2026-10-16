import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateBookSchema,
  createUpdateBookSchema,
  createGenerateCoursesFromBookSchema,
  type CreateBookInput,
  type UpdateBookInput,
  type GenerateCoursesFromBookInput,
} from "@workspace/types"

export type { CreateBookInput, UpdateBookInput, GenerateCoursesFromBookInput }

export function useCreateBookSchema() {
  const t = useTranslations("books.validation")
  return React.useMemo(
    () =>
      createCreateBookSchema({
        titleMin: t("titleMin"),
      }),
    [t]
  )
}

export function useUpdateBookSchema() {
  const t = useTranslations("books.validation")
  return React.useMemo(
    () =>
      createUpdateBookSchema({
        titleMin: t("titleMin"),
      }),
    [t]
  )
}

export function useGenerateCoursesFromBookSchema() {
  const t = useTranslations("books.validation")
  return React.useMemo(
    () =>
      createGenerateCoursesFromBookSchema({
        termsCountMin: t("termsCountMin"),
        termsCountMax: t("termsCountMax"),
        baseFeeMin: t("baseFeeMin"),
      }),
    [t]
  )
}
