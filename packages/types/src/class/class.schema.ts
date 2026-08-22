import { z } from "zod"

export const ClassSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  termId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  capacity: z.number(),
  fee: z.number(),
  teacherName: z.string().nullable().optional(),
  schedule: z.string().nullable().optional(),
  term: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      isActive: z.boolean(),
    })
    .optional(),
  course: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      baseFee: z.number(),
    })
    .optional(),
  enrolledCount: z.number().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type ClassDto = z.infer<typeof ClassSchema>
