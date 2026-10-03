import { z } from "zod"
import { SCHEDULING_PLAN_STATUSES } from "./scheduling.constants.js"
import { SchedulingProposalSchema } from "./scheduling-proposal.schema.js"
import { SchedulingScoreBreakdownSchema } from "./scheduling-score.schema.js"
import { SchedulingUnresolvedRequirementSchema } from "./scheduling-unresolved-requirement.schema.js"
import { SchedulingWarningSchema } from "./scheduling-warning.schema.js"

export const SchedulingPlanSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  runId: z.string().uuid(),
  status: z.enum(SCHEDULING_PLAN_STATUSES),
  rank: z.number().int().positive(),
  isRecommended: z.boolean(),
  earnedWeightedPoints: z.number().min(0).max(100),
  applicableWeightedPoints: z.number().min(0).max(100),
  qualityIndex: z.number().min(0).max(100).nullable().optional(),
  coveragePercent: z.number().min(0).max(100).nullable().optional(),
  minimumCourseCoveragePercent: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  scoreBreakdown: SchedulingScoreBreakdownSchema,
  metricsSnapshot: z.record(z.unknown()),
  weightsSnapshot: z.record(z.unknown()),
  timeGroupsSnapshot: z.record(z.unknown()),
  dataCompletenessSnapshot: z.record(z.unknown()),
  warnings: z
    .array(SchedulingWarningSchema)
    .nullish()
    .transform((warnings) => warnings ?? []),
  formulaVersion: z.string().trim().min(1),
  generatedAt: z.string().or(z.date()),
  lastScoredAt: z.string().or(z.date()),
  manualEditCount: z.number().int().nonnegative(),
  firstReviewStartedAt: z.string().or(z.date()).nullable().optional(),
  selectedAt: z.string().or(z.date()).nullable().optional(),
  rejectedAt: z.string().or(z.date()).nullable().optional(),
  publishedAt: z.string().or(z.date()).nullable().optional(),
  proposals: z.array(SchedulingProposalSchema).default([]),
  unresolvedRequirements: z
    .array(SchedulingUnresolvedRequirementSchema)
    .default([]),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type SchedulingPlanDto = z.infer<typeof SchedulingPlanSchema>
