import { z } from "zod"

export const TermLifecycleStatusSchema = z.enum([
  "ACTIVE",
  "REGISTERING",
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
  operatingPhaseId: z.string().uuid().nullable().optional(),
  operatingPhase: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      months: z.array(z.number().int()),
      startTime: z.string(),
      endTime: z.string(),
      slotDurationMinutes: z.number().int(),
    })
    .nullable()
    .optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  classesCount: z.number().optional(),
})

export type TermDto = z.infer<typeof TermSchema>
