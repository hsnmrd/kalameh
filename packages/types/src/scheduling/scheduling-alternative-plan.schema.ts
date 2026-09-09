import { z } from "zod"
import { SchedulingPlanCompositionSchema } from "./scheduling-plan-composition.schema.js"

export const SchedulingAlternativePlanSchema = z.object({
  planKey: z.string().trim().min(1),
  rank: z.number().int().positive(),
  isRecommended: z.boolean(),
  isWithinCoverageBand: z.boolean(),
  excludedAssignmentKeys: z.array(z.string().trim().min(1)),
  composition: SchedulingPlanCompositionSchema,
})

export const SchedulingAlternativePlanGenerationSchema = z
  .object({
    plans: z.array(SchedulingAlternativePlanSchema).max(3),
    summary: z.object({
      requestedPlanCount: z.number().int().min(1).max(3),
      generatedPlanCount: z.number().int().nonnegative().max(3),
      searchAttemptCount: z.number().int().nonnegative(),
      searchLimitReached: z.boolean(),
    }),
  })
  .superRefine((generation, context) => {
    const expectedRanks = generation.plans.map((_, index) => index + 1)
    const recommendedCount = generation.plans.filter(
      ({ isRecommended }) => isRecommended
    ).length
    const signatures = generation.plans.map(({ composition }) =>
      composition.assignments
        .map(({ candidate }) => candidate.assignmentKey)
        .sort()
        .join("|")
    )

    if (
      generation.summary.generatedPlanCount !== generation.plans.length ||
      generation.plans.length > generation.summary.requestedPlanCount ||
      generation.plans.some(
        ({ rank }, index) => rank !== expectedRanks[index]
      ) ||
      recommendedCount !== (generation.plans.length === 0 ? 0 : 1) ||
      (generation.plans.length > 0 && !generation.plans[0]?.isRecommended) ||
      new Set(generation.plans.map(({ planKey }) => planKey)).size !==
        generation.plans.length ||
      new Set(signatures).size !== signatures.length ||
      generation.plans.some(
        ({ excludedAssignmentKeys }) =>
          new Set(excludedAssignmentKeys).size !== excludedAssignmentKeys.length
      )
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["summary"] })
    }
  })

export type SchedulingAlternativePlan = z.infer<
  typeof SchedulingAlternativePlanSchema
>
export type SchedulingAlternativePlanGeneration = z.infer<
  typeof SchedulingAlternativePlanGenerationSchema
>
