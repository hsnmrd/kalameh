"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createCreateOperatingPhaseSchema,
  createUpdateOperatingPhaseSchema,
  type CreateOperatingPhaseInput,
  type UpdateOperatingPhaseInput,
} from "@workspace/types"

export type { CreateOperatingPhaseInput, UpdateOperatingPhaseInput }

export function useCreateOperatingPhaseSchema() {
  const t = useTranslations("operating-phases.validation")

  return React.useMemo(() => {
    return createCreateOperatingPhaseSchema({
      titleMin: t("titleMin"),
      monthsRequired: t("monthsRequired"),
      startTimeInvalid: t("timeInvalid"),
      endTimeInvalid: t("timeInvalid"),
      timeOrderInvalid: t("timeOrderInvalid"),
      durationRange: t("durationRange"),
      daysRequired: t("daysRequired"),
      breakRequired: t("breakRequired"),
      breakOrderInvalid: t("breakOrderInvalid"),
    })
  }, [t])
}

export function useUpdateOperatingPhaseSchema() {
  const t = useTranslations("operating-phases.validation")

  return React.useMemo(() => {
    return createUpdateOperatingPhaseSchema({
      titleMin: t("titleMin"),
      monthsRequired: t("monthsRequired"),
      startTimeInvalid: t("timeInvalid"),
      endTimeInvalid: t("timeInvalid"),
      timeOrderInvalid: t("timeOrderInvalid"),
      durationRange: t("durationRange"),
      daysRequired: t("daysRequired"),
      breakRequired: t("breakRequired"),
      breakOrderInvalid: t("breakOrderInvalid"),
    })
  }, [t])
}
