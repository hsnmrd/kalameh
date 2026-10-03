import type {
  CourseDto,
  CreateCourseInput,
  UpdateCourseInput,
} from "@workspace/types"
import { api } from "../client"

export const coursesResource = api.resource("courses", {
  list: api.get<
    CourseDto[],
    { instituteId?: string; search?: string; prerequisiteId?: string } | void
  >("/courses", {
    query: (params) => params || {},
  }),
  detail: api.get<CourseDto, string>((id) => `/courses/${id}`),
  create: api.post<CourseDto, CreateCourseInput>("/courses"),
  update: api.patch<CourseDto, { id: string; body: UpdateCourseInput }>(
    ({ id }) => `/courses/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
})
