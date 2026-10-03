import { z } from "zod"
import { SchedulingCandidateRejectionSchema } from "./scheduling-candidate-rejection.schema.js"
import { SchedulingFeasibleCandidateSchema } from "./scheduling-feasible-candidate.schema.js"

export const SchedulingHardConstraintEvaluationSchema = z
  .object({
    accepted: z.array(SchedulingFeasibleCandidateSchema),
    rejected: z.array(SchedulingCandidateRejectionSchema),
    summary: z.object({
      inputCandidateCount: z.number().int().nonnegative(),
      feasibleAssignmentCount: z.number().int().nonnegative(),
      rejectedCandidateCount: z.number().int().nonnegative(),
    }),
  })
  .superRefine((evaluation, context) => {
    if (
      evaluation.summary.feasibleAssignmentCount !==
        evaluation.accepted.length ||
      evaluation.summary.rejectedCandidateCount !==
        evaluation.rejected.length ||
      evaluation.summary.inputCandidateCount !==
        new Set([
          ...evaluation.accepted.map((candidate) => candidate.key),
          ...evaluation.rejected.map(({ candidate }) => candidate.key),
        ]).size
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
      })
    }
  })

export type SchedulingHardConstraintEvaluation = z.infer<
  typeof SchedulingHardConstraintEvaluationSchema
>
