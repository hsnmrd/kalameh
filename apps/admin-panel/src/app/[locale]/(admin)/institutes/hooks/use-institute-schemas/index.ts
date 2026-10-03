"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateInstituteSchema,
  createUpdateInstituteSchema,
  type CreateInstituteInput,
  type UpdateInstituteInput,
} from "@workspace/types"

export function useCreateInstituteSchema() {
  const t = useTranslations("institutes")

  return React.useMemo(
    () =>
      createCreateInstituteSchema({
        nameMin: t("validation.nameMin"),
        subdomainMin: t("validation.subdomainMin"),
        subdomainRegex: t("validation.subdomainRegex"),
        primaryColorRegex: t("validation.primaryColorRegex"),
      }),
    [t]
  )
}

export function useUpdateInstituteSchema() {
  const t = useTranslations("institutes")

  return React.useMemo(
    () =>
      createUpdateInstituteSchema({
        nameMin: t("validation.nameMin"),
        subdomainMin: t("validation.subdomainMin"),
        subdomainRegex: t("validation.subdomainRegex"),
        primaryColorRegex: t("validation.primaryColorRegex"),
      }),
    [t]
  )
}

export type { CreateInstituteInput, UpdateInstituteInput }
