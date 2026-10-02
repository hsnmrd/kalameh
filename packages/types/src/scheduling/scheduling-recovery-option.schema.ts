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
  avatarUrl: z.string().nullable().optional(),
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
  classroom: SchedulingRecoveryClassroomSchema.nullable(),
})

const SchedulingTeacherCalendarSlotSchema = z.object({
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  status: z.enum(["FREE", "BUSY"]),
  title: z.string().nullable(),
  source: z.enum(["AVAILABILITY", "PLAN", "EXISTING_CLASS"]),
})

export const SchedulingTeacherCalendarSchema = z.object({
  teacher: SchedulingRecoveryTeacherSchema,
  teachableCourses: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(1),
      })
    )
    .default([]),
  slots: z.array(SchedulingTeacherCalendarSlotSchema),
})

const SchedulingTeacherReassignmentStepSchema = z.object({
  proposalId: z.string().uuid(),
  classTitle: z.string().trim().min(1),
  courseId: z.string().uuid(),
  fromTeacher: SchedulingRecoveryTeacherSchema,
  toTeacher: SchedulingRecoveryTeacherSchema,
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
})

export const SchedulingTeacherReassignmentChainSchema = z.object({
  key: z.string().trim().min(1),
  targetAssignment: z.object({
    teacher: SchedulingRecoveryTeacherSchema,
    classroom: SchedulingRecoveryClassroomSchema.nullable(),
    deliveryMode: z.enum(CLASS_DELIVERY_MODES),
    daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  }),
  reassignments: z.array(SchedulingTeacherReassignmentStepSchema).min(1),
  validation: z.object({
    allTeachersQualified: z.literal(true),
    allWithinAvailability: z.literal(true),
    noTeacherConflicts: z.literal(true),
    targetClassroomAvailable: z.literal(true),
  }),
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

export const SchedulingTeacherOutreachOptionSchema = z.object({
  key: z.string().trim().min(1),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES),
  daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
  startTime: z.string().regex(SCHEDULING_TIME_REGEX),
  endTime: z.string().regex(SCHEDULING_TIME_REGEX),
  teacher: SchedulingRecoveryTeacherSchema,
  availabilityChangeDays: z.array(z.enum(WEEK_DAYS)),
  availableClassrooms: z.array(SchedulingRecoveryClassroomSchema),
  higherLevelCourseTitle: z.string().trim().min(1).nullable().optional(),
  isAccepted: z.boolean().optional(),
  acceptedProposalId: z.string().uuid().nullable().optional(),
})

export const SchedulingStaffingFallbackSchema = z.object({
  addTeacherSuggested: z.boolean(),
  availabilityOptions: z.array(SchedulingTeacherOutreachOptionSchema),
})

export const SchedulingRecoveryAnalysisSchema = z.object({
  options: z.array(SchedulingRecoveryOptionSchema),
  totalOptionCount: z.number().int().nonnegative(),
  qualifiedTeacherCount: z.number().int().nonnegative(),
  compatibleClassroomCount: z.number().int().nonnegative(),
  busyTeachers: z.array(SchedulingRecoveryTeacherSchema),
  teacherCalendars: z.array(SchedulingTeacherCalendarSchema),
  reassignmentChains: z.array(SchedulingTeacherReassignmentChainSchema),
  staffingFallback: SchedulingStaffingFallbackSchema.default({
    addTeacherSuggested: true,
    availabilityOptions: [],
  }),
})

export type SchedulingRecoveryOption = z.infer<
  typeof SchedulingRecoveryOptionSchema
>
export type SchedulingRecoveryAnalysis = z.infer<
  typeof SchedulingRecoveryAnalysisSchema
>
export type SchedulingTeacherCalendar = z.infer<
  typeof SchedulingTeacherCalendarSchema
>
export type SchedulingTeacherReassignmentChain = z.infer<
  typeof SchedulingTeacherReassignmentChainSchema
>
export type SchedulingTeacherOutreachOption = z.infer<
  typeof SchedulingTeacherOutreachOptionSchema
>
export type SchedulingStaffingFallback = z.infer<
  typeof SchedulingStaffingFallbackSchema
>
