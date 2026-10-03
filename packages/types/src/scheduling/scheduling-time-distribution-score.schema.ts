import { z } from "zod"
import { SchedulingScoreCriterionSchema } from "./scheduling-score.schema.js"
import { SchedulingWarningSchema } from "./scheduling-warning.schema.js"

const groupCountsSchema = z.object({
  ODD_MORNING: z.number().int().nonnegative(),
  ODD_EVENING: z.number().int().nonnegative(),
  EVEN_MORNING: z.number().int().nonnegative(),
  EVEN_EVENING: z.number().int().nonnegative(),
  NEUTRAL_MORNING: z.number().int().nonnegative(),
  NEUTRAL_EVENING: z.number().int().nonnegative(),
  MIXED_MORNING: z.number().int().nonnegative(),
  MIXED_EVENING: z.number().int().nonnegative(),
})

export const SchedulingTimeDistributionScoreSchema = z
  .object({
    requirementId: z.string().uuid(),
    requiredClassCount: z.number().int().positive(),
    scheduledClassCount: z.number().int().nonnegative(),
    targetPrimaryGroupCount: z.number().int().min(1).max(4),
    distinctPrimaryGroupCount: z.number().int().min(0).max(4),
    groupCounts: groupCountsSchema,
    dayAxisScore: z.number().min(0).max(1),
    timeAxisScore: z.number().min(0).max(1),
    groupDiversityScore: z.number().min(0).max(1),
    balanceScore: z.number().min(0).max(1),
    criterion: SchedulingScoreCriterionSchema,
    warnings: z.array(SchedulingWarningSchema),
  })
  .superRefine((score, context) => {
    const scheduledClassCount = Object.values(score.groupCounts).reduce(
      (sum, count) => sum + count,
      0
    )
    const expectedTarget = Math.min(score.requiredClassCount, 4)
    const expectedDistinctPrimaryGroupCount = [
      score.groupCounts.ODD_MORNING,
      score.groupCounts.ODD_EVENING,
      score.groupCounts.EVEN_MORNING,
      score.groupCounts.EVEN_EVENING,
    ].filter((count) => count > 0).length
    const expectedNormalizedScore =
      Math.round(
        (score.dayAxisScore * 0.6 + score.timeAxisScore * 0.4) *
          score.groupDiversityScore *
          score.balanceScore *
          10000
      ) / 10000
    const expectedWeightedPoints =
      Math.round(expectedNormalizedScore * score.criterion.weight * 100) / 100

    if (
      score.scheduledClassCount !== scheduledClassCount ||
      score.scheduledClassCount > score.requiredClassCount ||
      score.targetPrimaryGroupCount !== expectedTarget ||
      score.distinctPrimaryGroupCount !== expectedDistinctPrimaryGroupCount ||
      score.criterion.code !== "SC_TIME_PATTERN_DIVERSITY" ||
      score.criterion.status !== "APPLICABLE" ||
      score.criterion.rawValue !== expectedNormalizedScore ||
      score.criterion.normalizedScore !== expectedNormalizedScore ||
      score.criterion.weightedPoints !== expectedWeightedPoints
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["criterion"] })
    }
  })

export type SchedulingTimeDistributionScore = z.infer<
  typeof SchedulingTimeDistributionScoreSchema
>
