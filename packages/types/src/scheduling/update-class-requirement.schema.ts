import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"

export const UpdateClassRequirementSchema = z.object({
  termId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  branchId: z.string().uuid().nullable().optional(),
  requiredClassCount: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  sessionDurationMinutes: z.number().int().positive().optional(),
  sessionsPerWeek: z.number().int().positive().nullable().optional(),
  totalSessions: z.number().int().positive().nullable().optional(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateClassRequirementInput = z.infer<
  typeof UpdateClassRequirementSchema
>
