import type {
  OperatingPhaseWithSlots,
  CreateOperatingPhaseInput,
  UpdateOperatingPhaseInput,
  PhaseSlotsCalculationResult,
} from "@workspace/types"
import { api } from "../client"

export const operatingPhasesResource = api.resource("operating-phases", {
  list: api.get<OperatingPhaseWithSlots[], { instituteId?: string } | void>(
    "/operating-phases",
    {
      query: (params) => params || {},
    }
  ),
  detail: api.get<OperatingPhaseWithSlots, string>(
    (id) => `/operating-phases/${id}`
  ),
  preview: api.get<
    PhaseSlotsCalculationResult,
    { startTime: string; endTime: string; slotDurationMinutes?: number }
  >("/operating-phases/preview", {
    query: (params) => params,
  }),
  create: api.post<OperatingPhaseWithSlots, CreateOperatingPhaseInput>(
    "/operating-phases"
  ),
  update: api.patch<
    OperatingPhaseWithSlots,
    { id: string; body: UpdateOperatingPhaseInput }
  >(({ id }) => `/operating-phases/${id}`, {
    body: ({ body }) => body,
  }),
  delete: api.delete<{ success: boolean }, string>(
    (id) => `/operating-phases/${id}`
  ),
})
