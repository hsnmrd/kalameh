import type {
  TeacherDto,
  CreateTeacherInput,
  UpdateTeacherInput,
  TeacherLookupResponse,
  TeacherAvailability,
  TeacherAvailabilityInput,
} from "@workspace/types"
import { api } from "../client"

export const teachersResource = api.resource("teachers", {
  list: api.get<
    TeacherDto[],
    | {
        search?: string
        isActive?: boolean
        instituteId?: string
      }
    | undefined
  >("/teachers", {
    query: (params) => params || {},
  }),
  lookup: api.get<
    TeacherLookupResponse,
    { nationalCode?: string; phone?: string } | undefined
  >("/teachers/lookup", {
    query: (params) => params || {},
  }),
  detail: api.get<TeacherDto, string>((id) => `/teachers/${id}`),
  create: api.post<TeacherDto, CreateTeacherInput>("/teachers", {
    bodyType: "form-data",
  }),
  update: api.patch<TeacherDto, { id: string; body: UpdateTeacherInput }>(
    ({ id }) => `/teachers/${id}`,
    {
      body: ({ body }) => body,
      bodyType: "form-data",
    }
  ),
  updateAvailabilities: api.put<
    TeacherAvailability[],
    { id: string; availabilities: TeacherAvailabilityInput[] }
  >(({ id }) => `/teachers/${id}/availabilities`, {
    body: ({ availabilities }) => ({ availabilities }),
  }),
  delete: api.delete<
    { success: boolean; deactivated?: boolean; deleted?: boolean },
    string
  >((id) => `/teachers/${id}`),
  resetPassword: api.post<
    { success: boolean },
    { id: string; password?: string }
  >(({ id }) => `/teachers/${id}/reset-password`, {
    body: ({ password }) => ({ password }),
  }),
})
