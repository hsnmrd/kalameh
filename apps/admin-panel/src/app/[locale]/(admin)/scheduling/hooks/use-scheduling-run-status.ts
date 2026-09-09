"use client"

import { useQuery } from "@tanstack/react-query"
import type { SchedulingRunStatusDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export const SCHEDULING_RUN_POLL_INTERVAL = 2_000

export function getSchedulingRunPollInterval(state: {
  data?: SchedulingRunStatusDto
  error?: unknown
}) {
  if (state.error || state.data?.isTerminal) return false
  return SCHEDULING_RUN_POLL_INTERVAL
}

export function useSchedulingRunStatus(runId: string) {
  const { activeInstituteId } = useActiveInstitute()

  return useQuery({
    ...schedulingResource.runStatus.toQuery({
      runId,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(runId && activeInstituteId),
    retry: false,
    refetchInterval: (query) =>
      getSchedulingRunPollInterval({
        data: query.state.data,
        error: query.state.error,
      }),
  })
}
