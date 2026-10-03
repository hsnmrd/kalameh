import { z } from "zod"
import { SchedulingPreflightReportSchema } from "./scheduling-preflight-report.schema.js"
import { SCHEDULING_RUN_STATUSES } from "./scheduling.constants.js"

const TERMINAL_RUN_STATUSES = [
  "PREFLIGHT_FAILED",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const

export const SchedulingRunResultReferenceSchema = z
  .object({
    planIds: z.array(z.string().uuid()).min(1).max(3),
    recommendedPlanId: z.string().uuid().nullable(),
  })
  .superRefine((result, context) => {
    if (
      result.recommendedPlanId !== null &&
      !result.planIds.includes(result.recommendedPlanId)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recommendedPlanId"],
        message: "recommended plan must belong to the run result",
      })
    }
  })

export const SchedulingRunStatusSchema = z
  .object({
    runId: z.string().uuid(),
    status: z.enum(SCHEDULING_RUN_STATUSES),
    isTerminal: z.boolean(),
    result: SchedulingRunResultReferenceSchema.nullable(),
    preflightReport: SchedulingPreflightReportSchema.nullable(),
    failureCode: z.string().nullable(),
    failureMessage: z.string().nullable(),
    startedAt: z.string().or(z.date()).nullable(),
    completedAt: z.string().or(z.date()).nullable(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .superRefine((run, context) => {
    const isTerminal = TERMINAL_RUN_STATUSES.includes(
      run.status as (typeof TERMINAL_RUN_STATUSES)[number]
    )
    if (run.isTerminal !== isTerminal) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isTerminal"],
        message: "terminal flag must match the run status",
      })
    }

    if ((run.status === "COMPLETED") !== (run.result !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["result"],
        message: "only completed runs can expose result references",
      })
    }

    if (
      (run.status === "FAILED" || run.status === "PREFLIGHT_FAILED") &&
      !run.failureCode
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failureCode"],
        message: "failed runs require a failure code",
      })
    }
  })

export type SchedulingRunStatusDto = z.infer<typeof SchedulingRunStatusSchema>
