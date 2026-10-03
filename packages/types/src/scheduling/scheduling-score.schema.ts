import { z } from "zod"
import {
  SCHEDULING_CODE_REGEX,
  SCHEDULING_SCORE_STATUSES,
} from "./scheduling.constants.js"

export const SchedulingScoreCriterionSchema = z
  .object({
    code: z.string().regex(SCHEDULING_CODE_REGEX),
    status: z.enum(SCHEDULING_SCORE_STATUSES),
    rawValue: z.number().nullable(),
    normalizedScore: z.number().min(0).max(1).nullable(),
    weight: z.number().min(0).max(100),
    weightedPoints: z.number().min(0).max(100).nullable(),
    details: z.record(z.unknown()).default({}),
  })
  .superRefine((criterion, context) => {
    const values = [
      criterion.rawValue,
      criterion.normalizedScore,
      criterion.weightedPoints,
    ]

    if (
      criterion.status === "NOT_APPLICABLE" &&
      values.some((value) => value !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
      })
    }

    if (
      criterion.status === "APPLICABLE" &&
      values.some((value) => value === null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
      })
    }
  })

export const SchedulingScoreBreakdownSchema = z.object({
  criteria: z.array(SchedulingScoreCriterionSchema).default([]),
  earnedWeightedPoints: z.number().min(0).max(100).optional(),
  applicableWeightedPoints: z.number().min(0).max(100).optional(),
  qualityIndex: z.number().min(0).max(100).nullable().optional(),
})

export type SchedulingScoreCriterion = z.infer<
  typeof SchedulingScoreCriterionSchema
>
export type SchedulingScoreBreakdown = z.infer<
  typeof SchedulingScoreBreakdownSchema
>
