import { z } from "zod"

export const SchedulingRunQuerySchema = z.object({
  instituteId: z.string().uuid().optional(),
})

export type SchedulingRunQuery = z.infer<typeof SchedulingRunQuerySchema>
