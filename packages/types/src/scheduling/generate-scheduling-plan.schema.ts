import { z } from "zod"

const uniqueUuidArray = z
  .array(z.string().uuid())
  .transform((values) => Array.from(new Set(values)))

export const GenerateSchedulingPlanSchema = z.object({
  termId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  requirementIds: uniqueUuidArray.pipe(z.array(z.string().uuid()).min(1)),
  alternativePlanCount: z.number().int().min(1).max(3).default(3),
  sourceRunId: z.string().uuid().nullable().optional(),
  lockedProposalIds: uniqueUuidArray.default([]),
})

export type GenerateSchedulingPlanInput = z.infer<
  typeof GenerateSchedulingPlanSchema
>
