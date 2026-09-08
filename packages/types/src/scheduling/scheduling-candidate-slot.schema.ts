import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  SCHEDULING_TIME_GROUPS,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export const SchedulingCandidateSlotSchema = z
  .object({
    key: z.string().trim().min(1),
    requirementId: z.string().uuid(),
    courseId: z.string().uuid(),
    branchId: z.string().uuid().nullable(),
    teacherId: z.string().uuid(),
    qualificationId: z.string().uuid(),
    availabilityId: z.string().uuid(),
    dayOfWeek: z.enum(WEEK_DAYS),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX),
    durationMinutes: z.number().int().positive(),
    timeGroup: z.enum(SCHEDULING_TIME_GROUPS),
  })
  .refine((slot) => slot.startTime < slot.endTime, { path: ["endTime"] })
  .refine(
    (slot) =>
      toMinutes(slot.endTime) - toMinutes(slot.startTime) ===
      slot.durationMinutes,
    { path: ["durationMinutes"] }
  )

export type SchedulingCandidateSlot = z.infer<
  typeof SchedulingCandidateSlotSchema
>
