import { z } from "zod"
import { SCHEDULING_CODE_REGEX } from "./scheduling.constants.js"

export const SchedulingPreflightIssueSchema = z.object({
  code: z.string().regex(SCHEDULING_CODE_REGEX),
  severity: z.enum(["BLOCKING", "WARNING", "INFO"]),
  scope: z.enum(["INPUT", "COURSE", "REQUIREMENT"]),
  entityId: z.string().uuid().nullable().optional(),
  context: z.record(z.unknown()).default({}),
})

export type SchedulingPreflightIssue = z.infer<
  typeof SchedulingPreflightIssueSchema
>
