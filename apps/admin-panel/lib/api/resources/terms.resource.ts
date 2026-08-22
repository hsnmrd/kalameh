import type {
  TermDto,
  CreateTermInput,
  UpdateTermInput,
} from "@workspace/types"
import { api } from "../client"

export const termsResource = api.resource("terms", {
  list: api.get<TermDto[], { instituteId?: string } | void>("/terms", {
    query: (params) => params || {},
  }),
  detail: api.get<TermDto, string>((id) => `/terms/${id}`),
  create: api.post<TermDto, CreateTermInput>("/terms"),
  update: api.patch<TermDto, { id: string; body: UpdateTermInput }>(
    ({ id }) => `/terms/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
})
