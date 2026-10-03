import { z } from "zod"

export const ClassGradeRecordSchema = z.object({
  enrollmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  student: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    currentAllowedCourseId: z.string().uuid().nullable().optional(),
  }),
  finalScore: z.number().nullable().optional(),
  isPassed: z.boolean().nullable().optional(),
  status: z.string(),
})

export type ClassGradeRecordDto = z.infer<typeof ClassGradeRecordSchema>
