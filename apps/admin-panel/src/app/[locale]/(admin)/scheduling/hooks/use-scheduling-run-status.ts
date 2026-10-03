"use client"

import { useQuery } from "@tanstack/react-query"
import { MicroApiError } from "micro-rq"
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
    retry:
      process.env.NODE_ENV === "test"
        ? false
        : (failureCount, error) => {
            if (
              error instanceof MicroApiError &&
              (error.status === 401 ||
                error.status === 403 ||
                error.status === 404)
            ) {
              return false
            }
            return failureCount < 2
          },
    retryDelay: 1000,
    refetchInterval: (query) =>
      getSchedulingRunPollInterval({
        data: query.state.data,
        error: query.state.error,
      }),
  })
}
