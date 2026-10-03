import { z } from "zod"

export const SchedulingPersistenceResultSchema = z.object({
  runId: z.string().uuid(),
  status: z.literal("COMPLETED"),
  planIds: z.array(z.string().uuid()).min(1).max(3),
  proposalCount: z.number().int().nonnegative(),
  unresolvedRequirementCount: z.number().int().nonnegative(),
  completedAt: z.string().or(z.date()),
})

export type SchedulingPersistenceResult = z.infer<
  typeof SchedulingPersistenceResultSchema
>
