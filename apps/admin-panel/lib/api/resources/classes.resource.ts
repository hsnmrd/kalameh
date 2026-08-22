import type {
  ClassDto,
  CreateClassInput,
  UpdateClassInput,
  ClassFilterInput,
} from "@workspace/types"
import { api } from "../client"

export const classesResource = api.resource("classes", {
  list: api.get<ClassDto[], ClassFilterInput | void>("/classes", {
    query: (params) => params || {},
  }),
  available: api.get<{ allowedCourseTitle?: string; classes: ClassDto[] }>(
    "/classes/available"
  ),
  detail: api.get<ClassDto, string>((id) => `/classes/${id}`),
  create: api.post<ClassDto, CreateClassInput>("/classes"),
  update: api.patch<ClassDto, { id: string; body: UpdateClassInput }>(
    ({ id }) => `/classes/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
})
