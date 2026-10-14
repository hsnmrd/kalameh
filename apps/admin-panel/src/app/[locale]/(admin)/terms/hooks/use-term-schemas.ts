"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateTermSchema,
  createUpdateTermSchema,
  type CreateTermInput,
  type UpdateTermInput,
} from "@workspace/types"

export type { CreateTermInput, UpdateTermInput }

export function useCreateTermSchema() {
  const t = useTranslations("terms")
  return React.useMemo(() => {
    return createCreateTermSchema({
      titleMin: t("validation.titleMin"),
      startDateRequired: t("validation.startDateRequired"),
      endDateRequired: t("validation.endDateRequired"),
      operatingPhaseRequired: t("validation.operatingPhaseRequired"),
    })
  }, [t])
}

export function useUpdateTermSchema() {
  const t = useTranslations("terms")
  return React.useMemo(() => {
    return createUpdateTermSchema({
      titleMin: t("validation.titleMin"),
    })
  }, [t])
}
