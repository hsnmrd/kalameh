import { z } from "zod"

export const SchedulingPlanPublicationResultSchema = z
  .object({
    planId: z.string().uuid(),
    runId: z.string().uuid(),
    status: z.literal("PUBLISHED"),
    classIds: z.array(z.string().uuid()).min(1),
    proposalCount: z.number().int().positive(),
    publishedAt: z.string().or(z.date()),
  })
  .refine(({ classIds, proposalCount }) => classIds.length === proposalCount, {
    message: "classIds must contain exactly one class per proposal",
    path: ["classIds"],
  })

export type SchedulingPlanPublicationResult = z.infer<
  typeof SchedulingPlanPublicationResultSchema
>
