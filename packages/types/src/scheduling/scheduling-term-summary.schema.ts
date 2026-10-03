import { z } from "zod"

export const SCHEDULING_TERM_STATUSES = [
  "NO_REQUIREMENTS",
  "READY_TO_SCHEDULE",
  "GENERATING",
  "SCHEDULED",
  "PUBLISHED",
] as const

export type SchedulingTermStatus = (typeof SCHEDULING_TERM_STATUSES)[number]

export const SchedulingTermSummaryDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean(),
  operatingPhase: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      slotDurationMinutes: z.number().int(),
    })
    .nullable()
    .optional(),
  classesCount: z.number().int(),
  requirementsCount: z.number().int(),
  totalRequiredClasses: z.number().int(),
  schedulingStatus: z.enum(SCHEDULING_TERM_STATUSES),
  latestRun: z
    .object({
      id: z.string().uuid(),
      status: z.string(),
      createdAt: z.string().or(z.date()),
      plansCount: z.number().int(),
    })
    .nullable()
    .optional(),
})

export type SchedulingTermSummaryDto = z.infer<
  typeof SchedulingTermSummaryDtoSchema
>
