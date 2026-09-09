"use client"

import { useQueries } from "@tanstack/react-query"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export function useSchedulingPlanDetails(planIds: string[]) {
  const { activeInstituteId } = useActiveInstitute()

  return useQueries({
    queries: planIds.map((planId) => ({
      ...schedulingResource.planDetail.toQuery({
        planId,
        instituteId: activeInstituteId,
      }),
      enabled: Boolean(planId && activeInstituteId),
      retry: false,
    })),
  })
}
