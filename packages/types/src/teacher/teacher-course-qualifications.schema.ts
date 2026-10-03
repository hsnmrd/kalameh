import { z } from "zod"
import { TeacherCourseQualificationSchema } from "./teacher-course-qualification.schema.js"

export const TeacherCourseQualificationsSchema = z.array(
  TeacherCourseQualificationSchema
)

export type TeacherCourseQualificationsDto = z.infer<
  typeof TeacherCourseQualificationsSchema
>
