import { z } from "zod"
import { StudentNoteSchema } from "./student-note.schema.js"

export const STUDENT_SCHEDULE_STATUSES = ["INCOMPLETE", "COMPLETE"] as const
export type StudentScheduleStatus = (typeof STUDENT_SCHEDULE_STATUSES)[number]

export const STUDENT_SCHOOL_SHIFTS = [
  "MORNING",
  "AFTERNOON",
  "FLEXIBLE",
] as const
export type StudentSchoolShift = (typeof STUDENT_SCHOOL_SHIFTS)[number]

export const STUDENT_DAY_PREFERENCES = ["EVEN_DAYS", "ODD_DAYS", "ANY"] as const
export type StudentDayPreference = (typeof STUDENT_DAY_PREFERENCES)[number]

export const StudentProfileSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  fatherName: z.string().trim().nullable().optional(),
  birthDate: z.date().or(z.string()).nullable().optional(),
  gender: z.string().nullable().optional(),
  emergencyPhone: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  scheduleStatus: z.enum(STUDENT_SCHEDULE_STATUSES).default("INCOMPLETE"),
  schoolShift: z.enum(STUDENT_SCHOOL_SHIFTS).default("FLEXIBLE"),
  dayPreference: z.enum(STUDENT_DAY_PREFERENCES).default("ANY"),
  notes: z.array(StudentNoteSchema).optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
})

export type StudentProfileDto = z.infer<typeof StudentProfileSchema>
