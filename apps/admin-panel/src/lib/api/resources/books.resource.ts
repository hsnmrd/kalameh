import type {
  BookDto,
  CreateBookInput,
  UpdateBookInput,
  CourseDto,
  GenerateCoursesFromBookInput,
} from "@workspace/types"
import { api } from "../client"

export const booksResource = api.resource("books", {
  list: api.get<BookDto[], { instituteId?: string; search?: string } | void>(
    "/books",
    {
      query: (params) => params || {},
    }
  ),
  detail: api.get<BookDto & { courses: CourseDto[] }, string>(
    (id) => `/books/${id}`
  ),
  create: api.post<BookDto, CreateBookInput>("/books"),
  update: api.patch<BookDto, { id: string; body: UpdateBookInput }>(
    ({ id }) => `/books/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
  delete: api.delete<{ message: string }, string>((id) => `/books/${id}`),
  generateCourses: api.post<
    CourseDto[],
    { id: string; body: GenerateCoursesFromBookInput }
  >(({ id }) => `/books/${id}/generate-courses`, {
    body: ({ body }) => body,
  }),
})
