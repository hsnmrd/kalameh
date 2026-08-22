import { z } from "zod"

export const TermSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  title: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  classesCount: z.number().optional(),
})

export type TermDto = z.infer<typeof TermSchema>
