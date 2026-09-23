import type {
  ApplyTermDemandInput,
  ApplyTermDemandResult,
  CalculateTermDemandInput,
  GenerateSchedulingPlanInput,
  SchedulingPlanDetailsDto,
  SchedulingPlanPublicationResult,
  SchedulingPlanSelectionResult,
  SchedulingPlanValidation,
  SchedulingProposalDto,
  SchedulingRunDto,
  SchedulingRunStatusDto,
  SchedulingTermSummaryDto,
  SetSchedulingProposalLockInput,
  TermDemandReportDto,
  UpdateSchedulingProposalInput,
} from "@workspace/types"
import { api } from "../client"

export interface SchedulingPlanRequest {
  planId: string
  instituteId?: string
}

export interface SchedulingProposalRequest extends SchedulingPlanRequest {
  proposalId: string
}

const toInstituteQuery = ({ instituteId }: { instituteId?: string }) =>
  instituteId ? { instituteId } : {}

export const schedulingResource = api.resource("scheduling", {
  terms: api.get<SchedulingTermSummaryDto[], { instituteId?: string } | void>(
    "/scheduling/terms",
    {
      query: (params) =>
        params && "instituteId" in params && params.instituteId
          ? { instituteId: params.instituteId }
          : {},
    }
  ),
  calculateDemand: api.post<TermDemandReportDto, CalculateTermDemandInput>(
    "/scheduling/demand/calculate"
  ),
  applyDemand: api.post<ApplyTermDemandResult, ApplyTermDemandInput>(
    "/scheduling/demand/apply"
  ),
  generate: api.post<SchedulingRunDto, GenerateSchedulingPlanInput>(
    "/scheduling/plans/generate"
  ),
  runStatus: api.get<
    SchedulingRunStatusDto,
    { runId: string; instituteId?: string }
  >(({ runId }) => `/scheduling/runs/${runId}`, {
    query: toInstituteQuery,
  }),
  planDetail: api.get<SchedulingPlanDetailsDto, SchedulingPlanRequest>(
    ({ planId }) => `/scheduling/plans/${planId}`,
    { query: toInstituteQuery }
  ),
  selectPlan: api.post<SchedulingPlanSelectionResult, SchedulingPlanRequest>(
    ({ planId }) => `/scheduling/plans/${planId}/select`,
    {
      query: toInstituteQuery,
      body: () => undefined,
    }
  ),
  validatePlan: api.post<SchedulingPlanValidation, SchedulingPlanRequest>(
    ({ planId }) => `/scheduling/plans/${planId}/validate`,
    {
      query: toInstituteQuery,
      body: () => undefined,
    }
  ),
  publishPlan: api.post<SchedulingPlanPublicationResult, SchedulingPlanRequest>(
    ({ planId }) => `/scheduling/plans/${planId}/publish`,
    {
      query: toInstituteQuery,
      body: () => undefined,
    }
  ),
  updateProposal: api.patch<
    SchedulingProposalDto,
    SchedulingProposalRequest & { body: UpdateSchedulingProposalInput }
  >(
    ({ planId, proposalId }) =>
      `/scheduling/plans/${planId}/proposals/${proposalId}`,
    {
      query: toInstituteQuery,
      body: ({ body }) => body,
    }
  ),
  setProposalLock: api.patch<
    SchedulingProposalDto,
    SchedulingProposalRequest & { body: SetSchedulingProposalLockInput }
  >(
    ({ planId, proposalId }) =>
      `/scheduling/plans/${planId}/proposals/${proposalId}/lock`,
    {
      query: toInstituteQuery,
      body: ({ body }) => body,
    }
  ),
})
