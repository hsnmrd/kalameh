import type {
  BranchWithStats,
  CreateBranchInput,
  UpdateBranchInput,
} from "@workspace/types"
import { api } from "../client"

export const branchesResource = api.resource("branches", {
  list: api.get<
    BranchWithStats[],
    { instituteId?: string; search?: string; isActive?: boolean } | void
  >("/branches", {
    query: (params) => params || {},
  }),
  detail: api.get<BranchWithStats, string>((id) => `/branches/${id}`),
  create: api.post<BranchWithStats, CreateBranchInput>("/branches"),
  update: api.patch<BranchWithStats, { id: string; body: UpdateBranchInput }>(
    ({ id }) => `/branches/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
})
