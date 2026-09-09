"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export function useSchedulingPlanValidation(
  planId: string,
  planVersion: string | Date
) {
  const t = useTranslations("scheduling.planValidation")
  const { activeInstituteId } = useActiveInstitute()
  const mutation = useMutation({
    ...schedulingResource.validatePlan.toMutation(),
    onSuccess: (result) => {
      if (result.isValid) toast.success(t("validToast"))
      else toast.info(t("invalidToast"))
    },
  })
  const { reset } = mutation

  React.useEffect(() => reset(), [planVersion, reset])

  const validate = () => {
    mutation.mutate({ planId, instituteId: activeInstituteId })
  }

  return {
    result: mutation.data,
    isPending: mutation.isPending,
    validate,
  }
}
