import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"

const SchedulingRecoveryTeacherSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
})

const SchedulingRecoveryClassroomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  capacity: z.number().int().positive(),
})

const SchedulingRecoveryBlockingClassSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  conflictTypes: z.array(z.enum(["TEACHER", "CLASSROOM"])).min(1),
})

export const SchedulingRecoveryOptionSchema = z.object({
  key: z.string().trim().min(1),
  status: z.enum(["AVAILABLE_NOW", "REQUIRES_PLAN_CHANGE"]),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  teacher: SchedulingRecoveryTeacherSchema,
  availableClassrooms: z.array(SchedulingRecoveryClassroomSchema),
  blockingClasses: z.array(SchedulingRecoveryBlockingClassSchema),
})

export const SchedulingRecoveryAnalysisSchema = z.object({
  options: z.array(SchedulingRecoveryOptionSchema),
  totalOptionCount: z.number().int().nonnegative(),
  qualifiedTeacherCount: z.number().int().nonnegative(),
  compatibleClassroomCount: z.number().int().nonnegative(),
})

export type SchedulingRecoveryOption = z.infer<
  typeof SchedulingRecoveryOptionSchema
>
export type SchedulingRecoveryAnalysis = z.infer<
  typeof SchedulingRecoveryAnalysisSchema
>
