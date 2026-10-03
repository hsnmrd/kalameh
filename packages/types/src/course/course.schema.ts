import { z } from "zod"

export const CourseSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  title: z.string(),
  baseFee: z.number(),
  prerequisiteId: z.string().uuid().nullable().optional(),
  prerequisite: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  classesCount: z.number().optional(),
})

export type CourseDto = z.infer<typeof CourseSchema>
