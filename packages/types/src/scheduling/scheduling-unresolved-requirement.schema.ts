import { z } from "zod"
import { SCHEDULING_UNRESOLVED_REASON_CODES } from "./scheduling.constants.js"

export const SchedulingUnresolvedRequirementSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  planId: z.string().uuid(),
  classRequirementId: z.string().uuid().nullable().optional(),
  reasonCode: z.enum(SCHEDULING_UNRESOLVED_REASON_CODES),
  missingClassCount: z.number().int().positive(),
  details: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type SchedulingUnresolvedRequirementDto = z.infer<
  typeof SchedulingUnresolvedRequirementSchema
>
