import type {
  InstituteWithStats,
  CreateInstituteInput,
  UpdateInstituteInput,
} from "@workspace/types"
import { api } from "../client"

export const institutesResource = api.resource("institutes", {
  list: api.get<InstituteWithStats[]>("/institutes"),
  detail: api.get<InstituteWithStats, string>((id) => `/institutes/${id}`),
  create: api.post<InstituteWithStats, CreateInstituteInput>("/institutes"),
  update: api.patch<
    InstituteWithStats,
    { id: string; body: UpdateInstituteInput }
  >(({ id }) => `/institutes/${id}`, {
    body: ({ body }) => body,
  }),
})
