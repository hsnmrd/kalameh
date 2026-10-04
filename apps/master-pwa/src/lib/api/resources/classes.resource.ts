import type { ClassDto } from "@workspace/types"
import { api } from "../client"

export const classesResource = api.resource("classes", {
  available: api.get<{ allowedCourseTitle?: string; classes: ClassDto[] }>(
    "/classes/available"
  ),
  detail: api.get<ClassDto, string>((id) => `/classes/${id}`),
})
