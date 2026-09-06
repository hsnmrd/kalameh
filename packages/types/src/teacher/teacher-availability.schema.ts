import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const TeacherAvailabilitySchema = z.object({
  id: z.string().uuid().optional(),
  teacherProfileId: z.string().uuid().optional(),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(TIME_REGEX, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(TIME_REGEX, "Invalid end time format (HH:mm)"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})

export type TeacherAvailability = z.infer<typeof TeacherAvailabilitySchema>

export const TeacherAvailabilityInputSchema = z.object({
  id: z.string().uuid().optional(),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(TIME_REGEX, "Invalid start time format (HH:mm)"),
  endTime: z.string().regex(TIME_REGEX, "Invalid end time format (HH:mm)"),
})

export type TeacherAvailabilityInput = z.infer<
  typeof TeacherAvailabilityInputSchema
>
