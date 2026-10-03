import { z } from "zod"
import { SCHEDULING_SCORE_STATUSES } from "./scheduling.constants.js"
import { SchedulingFeasibleCandidateSchema } from "./scheduling-feasible-candidate.schema.js"

export const SchedulingCandidateCoverageSchema = z
  .object({
    candidate: SchedulingFeasibleCandidateSchema,
    status: z.enum(SCHEDULING_SCORE_STATUSES),
    knownStudentCount: z.number().int().nonnegative(),
    unknownStudentCount: z.number().int().nonnegative(),
    coveredStudentIds: z.array(z.string().uuid()),
    uncoveredStudentIds: z.array(z.string().uuid()),
    coveragePercent: z.number().min(0).max(100).nullable(),
  })
  .superRefine((coverage, context) => {
    const coveredCount = new Set(coverage.coveredStudentIds).size
    const uncoveredCount = new Set(coverage.uncoveredStudentIds).size
    const uniqueStudentCount = new Set([
      ...coverage.coveredStudentIds,
      ...coverage.uncoveredStudentIds,
    ]).size
    const expectedPercent =
      coverage.knownStudentCount === 0
        ? null
        : Math.round((coveredCount / coverage.knownStudentCount) * 10000) / 100

    if (
      coveredCount !== coverage.coveredStudentIds.length ||
      uncoveredCount !== coverage.uncoveredStudentIds.length ||
      uniqueStudentCount !== coverage.knownStudentCount ||
      coveredCount + uncoveredCount !== coverage.knownStudentCount ||
      coverage.status !==
        (coverage.knownStudentCount === 0 ? "NOT_APPLICABLE" : "APPLICABLE") ||
      coverage.coveragePercent !== expectedPercent
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["coveragePercent"],
      })
    }
  })

export type SchedulingCandidateCoverage = z.infer<
  typeof SchedulingCandidateCoverageSchema
>
