import { z } from "zod"

export const TermLifecycleStatusSchema = z.enum([
  "ACTIVE",
  "ONGOING",
  "REGISTERING",
  "CLASSES_STARTED",
  "FINAL_EXAMS",
  "GRADING",
  "UPCOMING",
  "COMPLETED",
  "INACTIVE",
])

export type TermLifecycleStatusDto = z.infer<typeof TermLifecycleStatusSchema>

export const TermSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  title: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean(),
  lifecycleStatus: TermLifecycleStatusSchema.optional(),
  lifecycleStatuses: z.array(TermLifecycleStatusSchema).optional(),
  operatingPhaseId: z.string().uuid(),
  operatingPhase: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      months: z.array(z.number().int()),
      startTime: z.string(),
      endTime: z.string(),
      slotDurationMinutes: z.number().int(),
      daysOfWeek: z.array(z.string()).optional(),
      hasBreak: z.boolean().optional(),
      breakStartTime: z.string().nullable().optional(),
      breakEndTime: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  studentSchedulesConfirmedAt: z.string().or(z.date()).nullable().optional(),
  studentSchedulesConfirmedByUserId: z.string().uuid().nullable().optional(),
  studentSchedulesConfirmedByUser: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable()
    .optional(),
  scoresFinalizedAt: z.string().or(z.date()).nullable().optional(),
  scoresFinalizedByUserId: z.string().uuid().nullable().optional(),
  scoresFinalizedByUser: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable()
    .optional(),
  allScoresSet: z.boolean().optional(),
  unscoredStudentsCount: z.number().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  classesCount: z.number().optional(),
  studentsCount: z.number().optional(),
  studentCount: z.number().optional(),
})

export type TermDto = z.infer<typeof TermSchema>
