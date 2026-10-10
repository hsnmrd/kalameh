import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import { parseTimeToMinutes } from "../operating-phase/operating-phase.schema.js"

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const TeacherAvailabilitySchema = z.object({
  id: z.string().uuid().optional(),
  teacherProfileId: z.string().uuid().optional(),
  termId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid(),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(TIME_REGEX, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(TIME_REGEX, "Invalid end time format (HH:mm)"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})

export type TeacherAvailability = z.infer<typeof TeacherAvailabilitySchema>

export const TeacherAvailabilityInputSchema = z.object({
  id: z.string().uuid().optional(),
  termId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().optional(),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(TIME_REGEX, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(TIME_REGEX, "Invalid end time format (HH:mm)"),
})

export type TeacherAvailabilityInput = z.infer<
  typeof TeacherAvailabilityInputSchema
>

export const ReplaceTeacherAvailabilitiesSchema = z.object({
  termId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  availabilities: z.array(TeacherAvailabilityInputSchema),
})

export type ReplaceTeacherAvailabilitiesInput = z.infer<
  typeof ReplaceTeacherAvailabilitiesSchema
>

export function isAvailabilityCoveringSlot(
  availability: { startTime: string; endTime: string },
  slot: { startTime: string; endTime: string }
): boolean {
  const aStart = parseTimeToMinutes(availability.startTime)
  const aEnd = parseTimeToMinutes(availability.endTime)
  const sStart = parseTimeToMinutes(slot.startTime)
  const sEnd = parseTimeToMinutes(slot.endTime)
  if (aStart === null || aEnd === null || sStart === null || sEnd === null) {
    return false
  }
  return aStart <= sStart && aEnd >= sEnd
}

export function subtractSlotFromAvailability(
  item: TeacherAvailabilityInput,
  slot: { startTime: string; endTime: string }
): TeacherAvailabilityInput[] {
  const itemStart = parseTimeToMinutes(item.startTime)
  const itemEnd = parseTimeToMinutes(item.endTime)
  const slotStart = parseTimeToMinutes(slot.startTime)
  const slotEnd = parseTimeToMinutes(slot.endTime)

  if (
    itemStart === null ||
    itemEnd === null ||
    slotStart === null ||
    slotEnd === null ||
    itemEnd <= slotStart ||
    itemStart >= slotEnd
  ) {
    return [item]
  }

  const result: TeacherAvailabilityInput[] = []

  if (itemStart < slotStart) {
    result.push({
      ...(item.termId !== undefined ? { termId: item.termId } : {}),
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: slot.startTime,
    })
  }

  if (itemEnd > slotEnd) {
    result.push({
      ...(item.termId !== undefined ? { termId: item.termId } : {}),
      dayOfWeek: item.dayOfWeek,
      startTime: slot.endTime,
      endTime: item.endTime,
    })
  }

  return result
}
