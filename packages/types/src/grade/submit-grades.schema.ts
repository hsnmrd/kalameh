import { z } from "zod"

export const SingleStudentGradeSchema = z.object({
  studentId: z.string().uuid(),
  finalScore: z.number().min(0).max(100).nullable().optional(),
  isPassed: z.boolean().nullable().optional(),
})

export type SingleStudentGradeInput = z.infer<typeof SingleStudentGradeSchema>

export const SubmitFinalGradesSchema = z.object({
  grades: z.array(SingleStudentGradeSchema).min(1),
})

export type SubmitFinalGradesInput = z.infer<typeof SubmitFinalGradesSchema>
