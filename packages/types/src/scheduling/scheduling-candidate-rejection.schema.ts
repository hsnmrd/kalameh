import { z } from "zod"
import { SCHEDULING_HARD_CONSTRAINT_CODES } from "./scheduling.constants.js"
import { SchedulingCandidateSlotSchema } from "./scheduling-candidate-slot.schema.js"

export const SchedulingCandidateRejectionSchema = z.object({
  candidate: SchedulingCandidateSlotSchema,
  reasonCodes: z.array(z.enum(SCHEDULING_HARD_CONSTRAINT_CODES)).min(1),
  context: z.record(z.unknown()).default({}),
})

export type SchedulingCandidateRejection = z.infer<
  typeof SchedulingCandidateRejectionSchema
>
