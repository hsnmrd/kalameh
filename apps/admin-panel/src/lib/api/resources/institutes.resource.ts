import type {
  InstituteWithStats,
  CreateInstituteInput,
  UpdateInstituteInput,
  InstituteCustomOffDay,
  CreateInstituteCustomOffDayInput,
} from "@workspace/types"
import { api } from "../client"

export const institutesResource = api.resource("institutes", {
  list: api.get<
    InstituteWithStats[],
    { search?: string; isActive?: boolean } | void
  >("/institutes", {
    query: (params) => params || {},
  }),
  detail: api.get<InstituteWithStats, string>((id) => `/institutes/${id}`),
  create: api.post<InstituteWithStats, CreateInstituteInput>("/institutes", {
    bodyType: "form-data",
  }),
  update: api.patch<
    InstituteWithStats,
    { id: string; body: UpdateInstituteInput }
  >(({ id }) => `/institutes/${id}`, {
    body: ({ body }) => body,
    bodyType: "form-data",
  }),
  delete: api.delete<{ success: boolean; message?: string }, string>(
    (id) => `/institutes/${id}`
  ),
  customOffDays: api.get<InstituteCustomOffDay[], string>(
    (id) => `/institutes/${id}/custom-off-days`
  ),
  createCustomOffDay: api.post<
    InstituteCustomOffDay | InstituteCustomOffDay[],
    { id: string; body: CreateInstituteCustomOffDayInput }
  >(({ id }) => `/institutes/${id}/custom-off-days`, {
    body: ({ body }) => body,
  }),
  deleteCustomOffDay: api.delete<
    { id: string },
    { id: string; offDayId: string }
  >(({ id, offDayId }) => `/institutes/${id}/custom-off-days/${offDayId}`),
})
