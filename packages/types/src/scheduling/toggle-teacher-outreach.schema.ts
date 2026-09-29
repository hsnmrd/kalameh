import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"

export const ToggleTeacherOutreachInputSchema = z.object({
  unresolvedRequirementId: z.string().uuid(),
  optionKey: z.string().trim().min(1),
  teacherId: z.string().uuid(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  availabilityChangeDays: z.array(z.enum(WEEK_DAYS)).min(1),
  classroomId: z.string().uuid().nullable().optional(),
})

export type ToggleTeacherOutreachInput = z.infer<
  typeof ToggleTeacherOutreachInputSchema
>
