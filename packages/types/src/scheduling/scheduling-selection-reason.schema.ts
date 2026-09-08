import { z } from "zod"
import { SCHEDULING_SELECTION_REASON_CODES } from "./scheduling.constants.js"

export const SchedulingSelectionReasonSchema = z.object({
  code: z.enum(SCHEDULING_SELECTION_REASON_CODES),
  evidence: z.record(z.unknown()).default({}),
})

export type SchedulingSelectionReason = z.infer<
  typeof SchedulingSelectionReasonSchema
>
