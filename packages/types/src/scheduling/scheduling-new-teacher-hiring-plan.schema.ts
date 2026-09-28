import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"

const HiringPlanCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
})

const HiringPlanClassroomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  capacity: z.number().int().positive(),
})

export const SchedulingNewTeacherHiringAssignmentSchema = z.object({
  key: z.string().trim().min(1),
  requirementId: z.string().uuid(),
  course: HiringPlanCourseSchema,
  classNumber: z.number().int().positive(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  classroom: HiringPlanClassroomSchema.nullable(),
})

export const SchedulingNewTeacherHiringSlotOptionSchema = z.object({
  key: z.string().trim().min(1),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  availableClassrooms: z.array(HiringPlanClassroomSchema),
  isFullyBooked: z.boolean(),
})

export const SchedulingNewTeacherHiringPlanSchema = z.object({
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1).max(7),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  totalClassCount: z.number().int().positive(),
  requiredCourses: z.array(HiringPlanCourseSchema).min(1),
  assignments: z.array(SchedulingNewTeacherHiringAssignmentSchema).min(1),
  availableTimeSlots: z
    .array(SchedulingNewTeacherHiringSlotOptionSchema)
    .default([]),
  coversAllUnresolvedClasses: z.boolean(),
  usesPreferredThreeDayPattern: z.boolean(),
  hasConsecutiveTimes: z.boolean(),
})

export const CommitHiringPlanAssignmentSchema = z.object({
  key: z.string().trim().min(1),
  requirementId: z.string().uuid(),
  courseId: z.string().uuid(),
  classNumber: z.number().int().positive(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  classroomId: z.string().uuid().nullable().optional(),
})

export const CommitHiringPlanInputSchema = z.object({
  assignments: z.array(CommitHiringPlanAssignmentSchema).min(1),
})

export type CommitHiringPlanAssignment = z.infer<
  typeof CommitHiringPlanAssignmentSchema
>

export type CommitHiringPlanInput = z.infer<typeof CommitHiringPlanInputSchema>

export type SchedulingNewTeacherHiringSlotOption = z.infer<
  typeof SchedulingNewTeacherHiringSlotOptionSchema
>

export type SchedulingNewTeacherHiringAssignment = z.infer<
  typeof SchedulingNewTeacherHiringAssignmentSchema
>

export type SchedulingNewTeacherHiringPlan = z.infer<
  typeof SchedulingNewTeacherHiringPlanSchema
>
