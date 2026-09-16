import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"

export const PreviewTermScheduleSchema = z.object({
  startDate: z.string().min(1),
  targetDays: z.coerce.number().int().min(1).max(365).optional(),
  targetSessions: z.coerce.number().int().min(1).max(365).optional(),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).optional(),
  classPatterns: z.array(z.array(z.enum(WEEK_DAYS))).optional(),
  skipHolidays: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(true),
})

export type PreviewTermScheduleInput = z.infer<typeof PreviewTermScheduleSchema>

export const BatchCreatePhaseTermsSchema = z.object({
  instituteId: z.string().uuid().optional(),
  operatingPhaseId: z.string().uuid(),
  jalaliYear: z.coerce.number().int().min(1400).max(1500),
  daysPerTerm: z.coerce.number().int().min(1).max(365).optional(),
  sessionsPerTerm: z.coerce.number().int().min(1).max(365).optional(),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).optional(),
  classPatterns: z.array(z.array(z.enum(WEEK_DAYS))).optional(),
  gapDaysBetweenTerms: z.coerce.number().int().min(0).max(30).default(2),
  terms: z
    .array(
      z.object({
        title: z.string().trim().min(2),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        isActive: z.boolean().optional().default(true),
      })
    )
    .optional(),
})

export type BatchCreatePhaseTermsInput = z.infer<
  typeof BatchCreatePhaseTermsSchema
>
