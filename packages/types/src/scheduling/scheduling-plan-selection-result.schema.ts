import { z } from "zod"

export const SchedulingPlanSelectionResultSchema = z.object({
  planId: z.string().uuid(),
  runId: z.string().uuid(),
  status: z.literal("SELECTED"),
  selectedAt: z.string().or(z.date()),
})

export type SchedulingPlanSelectionResult = z.infer<
  typeof SchedulingPlanSelectionResultSchema
>
