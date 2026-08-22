import { z } from "zod"

export const ClassFilterSchema = z.object({
  termId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export type ClassFilterInput = z.infer<typeof ClassFilterSchema>
