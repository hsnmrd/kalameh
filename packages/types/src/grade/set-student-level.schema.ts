import { z } from "zod"

export const SetStudentLevelSchema = z.object({
  currentAllowedCourseId: z.string().uuid().nullable(),
})

export type SetStudentLevelInput = z.infer<typeof SetStudentLevelSchema>
