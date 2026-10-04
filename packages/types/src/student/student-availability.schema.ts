import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"

export const STUDENT_AVAILABILITY_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const StudentAvailabilitySchema = z.object({
  id: z.string().uuid().optional(),
  studentProfileId: z.string().uuid().optional(),
  operatingPhaseId: z.string().uuid(),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z
    .string()
    .regex(
      STUDENT_AVAILABILITY_TIME_REGEX,
      "Invalid start time format (HH:mm)"
    ),
  endTime: z
    .string()
    .regex(STUDENT_AVAILABILITY_TIME_REGEX, "Invalid end time format (HH:mm)"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})

export type StudentAvailabilityDto = z.infer<typeof StudentAvailabilitySchema>

export const StudentAvailabilitySlotInputSchema = z.object({
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z
    .string()
    .regex(
      STUDENT_AVAILABILITY_TIME_REGEX,
      "Invalid start time format (HH:mm)"
    ),
  endTime: z
    .string()
    .regex(STUDENT_AVAILABILITY_TIME_REGEX, "Invalid end time format (HH:mm)"),
})

export type StudentAvailabilitySlotInput = z.infer<
  typeof StudentAvailabilitySlotInputSchema
>

export const UpdateStudentAvailabilitiesSchema = z.object({
  operatingPhaseId: z.string().uuid(),
  availabilities: z.array(StudentAvailabilitySlotInputSchema),
})

export type UpdateStudentAvailabilitiesInput = z.infer<
  typeof UpdateStudentAvailabilitiesSchema
>
