import type {
  TermDto,
  CreateTermInput,
  UpdateTermInput,
  CalculatedTermSchedule,
  PreviewTermScheduleInput,
  GeneratedTermProposal,
  BatchCreatePhaseTermsInput,
} from "@workspace/types"
import { api } from "../client"

export const termsResource = api.resource("terms", {
  list: api.get<
    TermDto[],
    {
      instituteId?: string
      search?: string
      isActive?: boolean
      operatingPhaseId?: string
      status?: string
    } | void
  >("/terms", {
    query: (params) => params || {},
  }),
  delete: api.delete<{ success: boolean }, string>((id) => `/terms/${id}`),
  detail: api.get<TermDto, string>((id) => `/terms/${id}`),
  create: api.post<TermDto, CreateTermInput>("/terms"),
  update: api.patch<TermDto, { id: string; body: UpdateTermInput }>(
    ({ id }) => `/terms/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
  previewSchedule: api.post<CalculatedTermSchedule, PreviewTermScheduleInput>(
    "/terms/preview-schedule"
  ),
  previewPhase: api.get<
    GeneratedTermProposal[],
    {
      operatingPhaseId: string
      jalaliYear: number
      daysPerTerm?: number
      sessionsPerTerm?: number
      daysOfWeek?: string
      classPatterns?: string
      gapDays?: number
    }
  >("/terms/preview-phase", {
    query: (params) => params,
  }),
  batchCreatePhase: api.post<TermDto[], BatchCreatePhaseTermsInput>(
    "/terms/batch-phase"
  ),
})
