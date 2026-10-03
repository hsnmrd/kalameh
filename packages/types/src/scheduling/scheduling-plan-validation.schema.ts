import { z } from "zod"
import { SCHEDULING_PLAN_VALIDATION_CODES } from "./scheduling.constants.js"

export const SchedulingPlanValidationViolationSchema = z.object({
  code: z.enum(SCHEDULING_PLAN_VALIDATION_CODES),
  scope: z.enum(["PLAN", "PROPOSAL"]),
  proposalId: z.string().uuid().nullable(),
  conflictingEntityIds: z.array(z.string().uuid()).default([]),
  context: z.record(z.unknown()).default({}),
})

export const SchedulingPlanValidationSchema = z
  .object({
    planId: z.string().uuid(),
    isValid: z.boolean(),
    validatedAt: z.string().or(z.date()),
    violations: z.array(SchedulingPlanValidationViolationSchema),
    summary: z.object({
      proposalCount: z.number().int().nonnegative(),
      violationCount: z.number().int().nonnegative(),
      invalidProposalCount: z.number().int().nonnegative(),
    }),
  })
  .superRefine((result, context) => {
    const invalidProposalCount = new Set(
      result.violations.flatMap((violation) =>
        violation.proposalId ? [violation.proposalId] : []
      )
    ).size
    if (
      result.isValid !== (result.violations.length === 0) ||
      result.summary.violationCount !== result.violations.length ||
      result.summary.invalidProposalCount !== invalidProposalCount
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summary"],
        message: "validation summary must match violations",
      })
    }
  })

export type SchedulingPlanValidation = z.infer<
  typeof SchedulingPlanValidationSchema
>
export type SchedulingPlanValidationViolation = z.infer<
  typeof SchedulingPlanValidationViolationSchema
>
