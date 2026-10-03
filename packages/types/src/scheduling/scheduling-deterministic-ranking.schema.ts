import { z } from "zod"
import { SchedulingDeterministicPlanCandidateSchema } from "./scheduling-deterministic-plan-candidate.schema.js"

export const SchedulingDeterministicRankedPlanSchema = z.object({
  candidate: SchedulingDeterministicPlanCandidateSchema,
  rank: z.number().int().positive(),
  isRecommended: z.boolean(),
  isWithinCoverageBand: z.boolean(),
  stableTieBreakerKey: z.string().min(1),
})

export const SchedulingDeterministicRankingSchema = z
  .object({
    plans: z.array(SchedulingDeterministicRankedPlanSchema),
    summary: z.object({
      planCount: z.number().int().nonnegative(),
      recommendationCandidateCount: z.number().int().nonnegative(),
      bestCoveragePercent: z.number().min(0).max(100).nullable(),
      recommendationCoverageFloor: z.number().min(0).max(100).nullable(),
    }),
  })
  .superRefine((ranking, context) => {
    const ranks = ranking.plans.map(({ rank }) => rank)
    const expectedRanks = ranking.plans.map((_, index) => index + 1)
    const recommendedCount = ranking.plans.filter(
      ({ isRecommended }) => isRecommended
    ).length
    const withinBandCount = ranking.plans.filter(
      ({ isWithinCoverageBand }) => isWithinCoverageBand
    ).length
    const coverageValues = ranking.plans.flatMap(({ candidate }) =>
      candidate.coveragePercent === null ? [] : [candidate.coveragePercent]
    )
    const expectedBestCoverage =
      coverageValues.length === 0 ? null : Math.max(...coverageValues)
    const expectedCoverageFloor =
      expectedBestCoverage === null
        ? null
        : Math.max(0, expectedBestCoverage - 5)
    const hasInvalidCoverageBand = ranking.plans.some(
      ({ candidate, isWithinCoverageBand }) =>
        isWithinCoverageBand !==
        (expectedCoverageFloor === null ||
          (candidate.coveragePercent !== null &&
            candidate.coveragePercent >= expectedCoverageFloor))
    )

    if (
      ranking.summary.planCount !== ranking.plans.length ||
      ranking.summary.recommendationCandidateCount !== withinBandCount ||
      ranks.some((rank, index) => rank !== expectedRanks[index]) ||
      recommendedCount !== (ranking.plans.length === 0 ? 0 : 1) ||
      (ranking.plans.length > 0 && !ranking.plans[0]?.isRecommended) ||
      ranking.summary.bestCoveragePercent !== expectedBestCoverage ||
      ranking.summary.recommendationCoverageFloor !== expectedCoverageFloor ||
      hasInvalidCoverageBand
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
      })
    }
  })

export type SchedulingDeterministicRankedPlan = z.infer<
  typeof SchedulingDeterministicRankedPlanSchema
>
export type SchedulingDeterministicRanking = z.infer<
  typeof SchedulingDeterministicRankingSchema
>
