"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateBranchSchema,
  createUpdateBranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "@workspace/types"

export type { CreateBranchInput, UpdateBranchInput }

export function useCreateBranchSchema() {
  const t = useTranslations("branches")
  return React.useMemo(() => {
    return createCreateBranchSchema({
      nameMin: t("validation.nameMin"),
    })
  }, [t])
}

export function useUpdateBranchSchema() {
  const t = useTranslations("branches")
  return React.useMemo(() => {
    return createUpdateBranchSchema({
      nameMin: t("validation.nameMin"),
    })
  }, [t])
}
