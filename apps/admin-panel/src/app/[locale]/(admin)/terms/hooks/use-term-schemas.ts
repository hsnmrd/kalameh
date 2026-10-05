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
      operatingPhaseRequired: t("createModal.operatingPhaseRequired"),
    })
  }, [t])
}

export function useUpdateTermSchema() {
  return React.useMemo(() => {
    return createUpdateTermSchema()
  }, [])
}
