"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateInstituteCustomOffDaySchema,
  type CreateInstituteCustomOffDayInput,
} from "@workspace/types"

export type { CreateInstituteCustomOffDayInput }

export function useCreateInstituteCustomOffDaySchema() {
  const t = useTranslations("setting.offDays")

  return React.useMemo(() => {
    return createCreateInstituteCustomOffDaySchema({
      titleMin: t("validation.titleMin"),
      dateInvalid: t("validation.dateInvalid"),
      rangeInvalid: t("validation.rangeInvalid"),
    })
  }, [t])
}
