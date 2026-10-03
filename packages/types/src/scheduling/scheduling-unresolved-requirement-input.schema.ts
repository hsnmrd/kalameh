import { z } from "zod"
import { SCHEDULING_UNRESOLVED_REASON_CODES } from "./scheduling.constants.js"

export const SchedulingUnresolvedRequirementInputSchema = z.object({
  classRequirementId: z.string().uuid(),
  reasonCode: z.enum(SCHEDULING_UNRESOLVED_REASON_CODES),
  missingClassCount: z.number().int().positive(),
  details: z.record(z.unknown()),
})

export type SchedulingUnresolvedRequirementInput = z.infer<
  typeof SchedulingUnresolvedRequirementInputSchema
>
