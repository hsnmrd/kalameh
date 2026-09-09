"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation } from "@tanstack/react-query"
import type { SchedulingPlanValidation } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export function useSchedulingPlanValidation(
  planId: string,
  planVersion: string | Date
) {
  const t = useTranslations("scheduling.planValidation")
  const { activeInstituteId } = useActiveInstitute()
  const versionKey =
    planVersion instanceof Date ? planVersion.toISOString() : planVersion
  const [validationState, setValidationState] = React.useState<{
    planVersion: string
    result: SchedulingPlanValidation
  }>()
  const mutation = useMutation({
    ...schedulingResource.validatePlan.toMutation(),
    onSuccess: (result) => {
      setValidationState({ planVersion: versionKey, result })
      if (result.isValid) toast.success(t("validToast"))
      else toast.info(t("invalidToast"))
    },
  })
  const { reset } = mutation

  React.useEffect(() => {
    reset()
  }, [versionKey, reset])

  const result =
    validationState?.planVersion === versionKey
      ? validationState?.result
      : undefined

  const setResult = (nextResult: SchedulingPlanValidation) => {
    setValidationState({ planVersion: versionKey, result: nextResult })
  }

  const validate = () => {
    mutation.mutate({ planId, instituteId: activeInstituteId })
  }

  return {
    result,
    setResult,
    isPending: mutation.isPending,
    validate,
  }
}
