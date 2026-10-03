import { z } from "zod"

export const TeacherCourseQualificationsQuerySchema = z.object({
  instituteId: z.string().uuid().optional(),
})

export type TeacherCourseQualificationsQuery = z.infer<
  typeof TeacherCourseQualificationsQuerySchema
>
