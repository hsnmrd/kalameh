import type {
  ClassRequirementDto,
  ClassRequirementFilter,
  ClassRequirementInput,
  UpdateClassRequirementInput,
} from "@workspace/types"
import { api } from "../client"

export const classRequirementsResource = api.resource("class-requirements", {
  list: api.get<ClassRequirementDto[], ClassRequirementFilter | void>(
    "/class-requirements",
    {
      query: (params) => params || {},
    }
  ),
  create: api.post<
    ClassRequirementDto,
    { body: ClassRequirementInput; instituteId?: string }
  >("/class-requirements", {
    body: ({ body }) => body,
    query: ({ instituteId }) => (instituteId ? { instituteId } : {}),
  }),
  update: api.patch<
    ClassRequirementDto,
    { id: string; body: UpdateClassRequirementInput; instituteId?: string }
  >(({ id }) => `/class-requirements/${id}`, {
    body: ({ body }) => body,
    query: ({ instituteId }) => (instituteId ? { instituteId } : {}),
  }),
  deactivate: api.delete<void, { id: string; instituteId?: string }>(
    ({ id }) => `/class-requirements/${id}`,
    {
      query: ({ instituteId }) => (instituteId ? { instituteId } : {}),
    }
  ),
})
