import type {
  TeacherDto,
  CreateTeacherInput,
  UpdateTeacherInput,
  TeacherLookupResponse,
  TeacherAvailability,
  TeacherAvailabilityInput,
  ExcelImportResult,
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
  getAvailabilities: api.get<
    TeacherAvailability[],
    { id: string; termId?: string; branchId?: string }
  >(({ id }) => `/teachers/${id}/availabilities`, {
    query: (params) => {
      const q: { termId?: string; branchId?: string } = {}
      if (params.termId) q.termId = params.termId
      if (params.branchId) q.branchId = params.branchId
      return q
    },
  }),
  updateAvailabilities: api.put<
    TeacherAvailability[],
    {
      id: string
      termId?: string
      branchId?: string
      availabilities: TeacherAvailabilityInput[]
    }
  >(({ id }) => `/teachers/${id}/availabilities`, {
    body: ({ termId, branchId, availabilities }) => ({
      ...(termId ? { termId } : {}),
      ...(branchId ? { branchId } : {}),
      availabilities,
    }),
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
  importExcel: api.post<
    ExcelImportResult,
    { formData: FormData; instituteId?: string } | FormData
  >("/teachers/import-excel", {
    query: (params) => {
      if (params instanceof FormData) return {}
      return params?.instituteId ? { instituteId: params.instituteId } : {}
    },
    body: (params) => (params instanceof FormData ? params : params.formData),
  }),
})
