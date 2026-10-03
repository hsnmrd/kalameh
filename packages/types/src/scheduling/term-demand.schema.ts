import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"

export const CalculateTermDemandInputSchema = z.object({
  termId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  instituteId: z.string().uuid().optional(),
  maxStudentsPerClass: z.coerce.number().int().min(1).max(100).optional(),
})

export type CalculateTermDemandInput = z.infer<
  typeof CalculateTermDemandInputSchema
>

export const SuggestedClassDtoSchema = z.object({
  key: z.string().trim().min(1),
  capacity: z.number().int().positive(),
})

export type SuggestedClassDto = z.infer<typeof SuggestedClassDtoSchema>

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
  suggestedClasses: z.array(SuggestedClassDtoSchema),
  plannedCapacity: z.number().int().nonnegative(),
  uncoveredStudentCount: z.number().int().nonnegative(),
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
  maxStudentsPerClass: z.number().int().positive(),
  maxAvailableRoomCapacity: z.number().int().positive().nullable(),
  effectiveCapacityLimit: z.number().int().positive(),
  warnings: z.array(z.enum(["NO_ACTIVE_CLASSROOMS", "CLASS_LIMIT_CLAMPED"])),
  totalEligibleStudents: z.number().int(),
  totalContinuingStudents: z.number().int(),
  totalNewPlacements: z.number().int(),
  totalSuggestedClasses: z.number().int(),
  totalPlannedCapacity: z.number().int().nonnegative(),
  totalUncoveredStudents: z.number().int().nonnegative(),
  courses: z.array(CourseDemandSummaryDtoSchema),
})

export type TermDemandReportDto = z.infer<typeof TermDemandReportDtoSchema>

export const ApplyTermDemandClassSchema = z.object({
  capacity: z.coerce.number().int().min(1).max(100),
})

export type ApplyTermDemandClass = z.infer<typeof ApplyTermDemandClassSchema>

export const ApplyTermDemandItemSchema = z.object({
  courseId: z.string().uuid(),
  classes: z.array(ApplyTermDemandClassSchema).max(50),
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
  acknowledgeShortfall: z.boolean().default(false),
  items: z.array(ApplyTermDemandItemSchema),
})

export type ApplyTermDemandInput = z.infer<typeof ApplyTermDemandInputSchema>

export const ApplyTermDemandResultSchema = z.object({
  createdCount: z.number().int(),
  deactivatedCount: z.number().int(),
  totalRequirements: z.number().int(),
  requirementIds: z.array(z.string().uuid()),
})

export type ApplyTermDemandResult = z.infer<typeof ApplyTermDemandResultSchema>
