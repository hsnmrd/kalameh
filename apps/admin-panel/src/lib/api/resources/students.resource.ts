import type {
  StudentDto,
  CreateStudentInput,
  UpdateStudentInput,
} from "@workspace/types"
import { api } from "../client"

export const studentsResource = api.resource("students", {
  list: api.get<
    StudentDto[],
    | {
        search?: string
        courseId?: string
        isActive?: boolean
        instituteId?: string
      }
    | undefined
  >("/students", {
    query: (params) => params || {},
  }),
  detail: api.get<StudentDto, string>((id) => `/students/${id}`),
  create: api.post<StudentDto, CreateStudentInput>("/students"),
  update: api.patch<StudentDto, { id: string; body: UpdateStudentInput }>(
    ({ id }) => `/students/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
  resetPassword: api.post<
    { message: string },
    { id: string; newPassword?: string }
  >(({ id }) => `/students/${id}/reset-password`, {
    body: ({ newPassword }) => ({ newPassword }),
  }),
})
