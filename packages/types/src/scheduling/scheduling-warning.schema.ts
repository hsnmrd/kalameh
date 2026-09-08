import { z } from "zod"
import {
  SCHEDULING_CODE_REGEX,
  SCHEDULING_WARNING_SCOPES,
  SCHEDULING_WARNING_SEVERITIES,
} from "./scheduling.constants.js"

export const SchedulingWarningSchema = z.object({
  code: z.string().regex(SCHEDULING_CODE_REGEX),
  severity: z.enum(SCHEDULING_WARNING_SEVERITIES),
  scope: z.enum(SCHEDULING_WARNING_SCOPES),
  context: z.record(z.unknown()).default({}),
})

export type SchedulingWarning = z.infer<typeof SchedulingWarningSchema>
