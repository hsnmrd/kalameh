import type {
  ClassroomDto,
  CreateClassroomInput,
  UpdateClassroomInput,
} from "@workspace/types"
import { api } from "../client"

export const classroomsResource = api.resource("classrooms", {
  list: api.get<
    ClassroomDto[],
    {
      instituteId?: string
      branchId?: string
      search?: string
      isActive?: boolean
    } | void
  >("/classrooms", {
    query: (params) => params || {},
  }),
  detail: api.get<ClassroomDto, string>((id) => `/classrooms/${id}`),
  create: api.post<ClassroomDto, CreateClassroomInput>("/classrooms"),
  update: api.patch<ClassroomDto, { id: string; body: UpdateClassroomInput }>(
    ({ id }) => `/classrooms/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
  delete: api.delete<{ success: boolean }, string>((id) => `/classrooms/${id}`),
})
