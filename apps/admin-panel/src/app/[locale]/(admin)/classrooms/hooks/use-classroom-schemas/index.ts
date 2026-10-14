"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateClassroomSchema,
  createUpdateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from "@workspace/types"

export type { CreateClassroomInput, UpdateClassroomInput }

export function useCreateClassroomSchema() {
  const t = useTranslations("classrooms")

  return React.useMemo(() => {
    return createCreateClassroomSchema({
      nameMin: t("validation.nameMin"),
      capacityMin: t("validation.capacityMin"),
      branchIdRequired: t("validation.branchIdRequired"),
    })
  }, [t])
}

export function useUpdateClassroomSchema() {
  const t = useTranslations("classrooms")

  return React.useMemo(() => {
    return createUpdateClassroomSchema({
      nameMin: t("validation.nameMin"),
      capacityMin: t("validation.capacityMin"),
    })
  }, [t])
}
