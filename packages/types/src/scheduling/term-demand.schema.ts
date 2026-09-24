import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"

export const CalculateTermDemandInputSchema = z.object({
  termId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  instituteId: z.string().uuid().optional(),
  defaultCapacity: z.coerce.number().int().min(1).max(100).optional(),
})

export type CalculateTermDemandInput = z.infer<
  typeof CalculateTermDemandInputSchema
>

export const CourseDemandSummaryDtoSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  baseFee: z.number().int(),
  prerequisiteId: z.string().uuid().nullable().optional(),
  prerequisiteTitle: z.string().nullable().optional(),
  eligibleStudentsCount: z.number().int(),
  passedPrerequisiteCount: z.number().int(),
  continuingStudentsCount: z.number().int(),
  newPlacementCount: z.number().int(),
  morningShiftCount: z.number().int(),
  afternoonShiftCount: z.number().int(),
  flexibleShiftCount: z.number().int(),
  evenDaysPreferenceCount: z.number().int(),
  oddDaysPreferenceCount: z.number().int(),
  anyDayPreferenceCount: z.number().int(),
  suggestedClassCount: z.number().int(),
  suggestedCapacity: z.number().int(),
  suggestedInPersonCount: z.number().int(),
  suggestedOnlineCount: z.number().int(),
  existingRequirementId: z.string().uuid().nullable().optional(),
  currentRequirementClassCount: z.number().int().nullable().optional(),
  sessionsPerWeek: z.number().int().positive().nullable().optional(),
})

export type CourseDemandSummaryDto = z.infer<
  typeof CourseDemandSummaryDtoSchema
>

export const TermDemandReportDtoSchema = z.object({
  termId: z.string().uuid(),
  termTitle: z.string(),
  currentTermId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  defaultCapacity: z.number().int(),
  totalEligibleStudents: z.number().int(),
  totalContinuingStudents: z.number().int(),
  totalNewPlacements: z.number().int(),
  totalSuggestedClasses: z.number().int(),
  courses: z.array(CourseDemandSummaryDtoSchema),
})

export type TermDemandReportDto = z.infer<typeof TermDemandReportDtoSchema>

export const ApplyTermDemandItemSchema = z.object({
  courseId: z.string().uuid(),
  requiredClassCount: z.coerce.number().int().min(1).max(50),
  capacity: z.coerce.number().int().min(1).max(100),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES).default("IN_PERSON"),
  sessionDurationMinutes: z.coerce.number().int().min(30).max(300).default(90),
  sessionsPerWeek: z.coerce.number().int().positive().nullable().optional(),
  totalSessions: z.coerce.number().int().positive().nullable().optional(),
})

export type ApplyTermDemandItem = z.infer<typeof ApplyTermDemandItemSchema>

export const ApplyTermDemandInputSchema = z.object({
  termId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  instituteId: z.string().uuid().optional(),
  items: z.array(ApplyTermDemandItemSchema),
})

export type ApplyTermDemandInput = z.infer<typeof ApplyTermDemandInputSchema>

export const ApplyTermDemandResultSchema = z.object({
  createdCount: z.number().int(),
  updatedCount: z.number().int(),
  totalRequirements: z.number().int(),
})

export type ApplyTermDemandResult = z.infer<typeof ApplyTermDemandResultSchema>
