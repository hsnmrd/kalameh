import { z } from "zod"

export const WEEK_DAYS = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

export const ClassSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  termId: z.string().uuid(),
  courseId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  classroomId: z.string().uuid().nullable().optional(),
  title: z.string(),
  capacity: z.number(),
  fee: z.number(),
  teacherName: z.string().nullable().optional(),
  schedule: z.string().nullable().optional(),
  daysOfWeek: z.array(z.string()).default([]),
  sessionDates: z.array(z.string()).default([]),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  branch: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  classroom: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      capacity: z.number().optional(),
    })
    .nullable()
    .optional(),
  term: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      isActive: z.boolean(),
    })
    .optional(),
  course: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      baseFee: z.number(),
    })
    .optional(),
  enrolledCount: z.number().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
})

export type ClassDto = z.infer<typeof ClassSchema>
