import { z } from "zod"
import { SCHEDULING_RUN_STATUSES } from "./scheduling.constants.js"
import { SchedulingPlanSchema } from "./scheduling-plan.schema.js"

export const SchedulingRunSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  termId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  requestedByUserId: z.string().uuid(),
  sourceRunId: z.string().uuid().nullable().optional(),
  status: z.enum(SCHEDULING_RUN_STATUSES),
  inputSnapshot: z.record(z.unknown()),
  settingsSnapshot: z.record(z.unknown()),
  preflightReport: z.record(z.unknown()).nullable().optional(),
  failureCode: z.string().nullable().optional(),
  failureMessage: z.string().nullable().optional(),
  startedAt: z.string().or(z.date()).nullable().optional(),
  completedAt: z.string().or(z.date()).nullable().optional(),
  plans: z.array(SchedulingPlanSchema).default([]),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type SchedulingRunDto = z.infer<typeof SchedulingRunSchema>
