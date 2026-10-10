import type {
  StudentDto,
  CreateStudentInput,
  UpdateStudentInput,
  StudentLookupResponse,
  StudentAvailabilityDto,
  StudentAvailabilitySlotInput,
  SetAllStudentsAvailableInput,
  SetAllStudentsAvailableResponse,
  ExcelImportResult,
} from "@workspace/types"
import { api } from "../client"

export const studentsResource = api.resource("students", {
  list: api.get<
    StudentDto[],
    | {
        search?: string
        courseId?: string
        branchId?: string
        isActive?: boolean
        instituteId?: string
      }
    | undefined
  >("/students", {
    query: (params) => params || {},
  }),
  lookup: api.get<
    StudentLookupResponse,
    { nationalCode?: string; phone?: string } | undefined
  >("/students/lookup", {
    query: (params) => params || {},
  }),
  detail: api.get<StudentDto, string>((id) => `/students/${id}`),
  create: api.post<StudentDto, CreateStudentInput>("/students", {
    bodyType: "form-data",
  }),
  update: api.patch<StudentDto, { id: string; body: UpdateStudentInput }>(
    ({ id }) => `/students/${id}`,
    {
      body: ({ body }) => body,
      bodyType: "form-data",
    }
  ),
  resetPassword: api.post<
    { message: string },
    { id: string; newPassword?: string }
  >(({ id }) => `/students/${id}/reset-password`, {
    body: ({ newPassword }) => ({ newPassword }),
  }),
  addNote: api.post<StudentDto, { id: string; content: string }>(
    ({ id }) => `/students/${id}/notes`,
    {
      body: ({ content }) => ({ content }),
    }
  ),
  getAvailabilities: api.get<
    StudentAvailabilityDto[],
    { id: string; operatingPhaseId?: string }
  >(({ id }) => `/students/${id}/availabilities`, {
    query: (params) =>
      params.operatingPhaseId
        ? { operatingPhaseId: params.operatingPhaseId }
        : {},
  }),
  updateAvailabilities: api.put<
    StudentAvailabilityDto[],
    {
      id: string
      operatingPhaseId: string
      availabilities: StudentAvailabilitySlotInput[]
    }
  >(({ id }) => `/students/${id}/availabilities`, {
    body: ({ operatingPhaseId, availabilities }) => ({
      operatingPhaseId,
      availabilities,
    }),
  }),
  setAllAvailable: api.post<
    SetAllStudentsAvailableResponse,
    SetAllStudentsAvailableInput
  >("/students/bulk-availability"),
  importExcel: api.post<
    ExcelImportResult,
    { formData: FormData; instituteId?: string } | FormData
  >("/students/import-excel", {
    query: (params) => {
      if (params instanceof FormData) return {}
      return params?.instituteId ? { instituteId: params.instituteId } : {}
    },
    body: (params) => (params instanceof FormData ? params : params.formData),
  }),
})
