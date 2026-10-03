import { z } from "zod"
import { SCHEDULING_SCORE_STATUSES } from "./scheduling.constants.js"

export const SchedulingCourseCoverageSchema = z
  .object({
    courseId: z.string().uuid(),
    status: z.enum(SCHEDULING_SCORE_STATUSES),
    knownStudentCount: z.number().int().nonnegative(),
    unknownStudentCount: z.number().int().nonnegative(),
    bestCoveredStudentCount: z.number().int().nonnegative(),
    bestCoveragePercent: z.number().min(0).max(100).nullable(),
    candidateCount: z.number().int().nonnegative(),
  })
  .superRefine((coverage, context) => {
    const expectedStatus =
      coverage.knownStudentCount === 0 ? "NOT_APPLICABLE" : "APPLICABLE"
    const expectedPercent =
      coverage.knownStudentCount === 0
        ? null
        : Math.round(
            (coverage.bestCoveredStudentCount / coverage.knownStudentCount) *
              10000
          ) / 100

    if (
      coverage.bestCoveredStudentCount > coverage.knownStudentCount ||
      coverage.status !== expectedStatus ||
      coverage.bestCoveragePercent !== expectedPercent
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bestCoveragePercent"],
      })
    }
  })

export type SchedulingCourseCoverage = z.infer<
  typeof SchedulingCourseCoverageSchema
>
