import { z } from "zod"
import { TeacherCourseIdsInputSchema } from "./teacher-course-qualification.schema.js"

export const ReplaceTeacherCoursesSchema = z.object({
  courseIds: TeacherCourseIdsInputSchema.default([]),
})

export type ReplaceTeacherCoursesInput = z.infer<
  typeof ReplaceTeacherCoursesSchema
>
