import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import { SCHEDULING_TIME_REGEX } from "./scheduling.constants.js"

export const SchedulingDeterministicAssignmentSchema = z
  .object({
    assignmentKey: z.string().trim().min(1),
    teacherId: z.string().uuid(),
    courseId: z.string().uuid(),
    dayOfWeek: z.enum(WEEK_DAYS),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX),
    classroomId: z.string().uuid().nullable(),
  })
  .superRefine((assignment, context) => {
    if (assignment.startTime >= assignment.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
      })
    }
  })

export const SchedulingDeterministicPlanCandidateSchema = z
  .object({
    planKey: z.string().trim().min(1),
    earnedWeightedPoints: z.number().min(0).max(100),
    coveragePercent: z.number().min(0).max(100).nullable(),
    minimumCourseCoveragePercent: z.number().min(0).max(100).nullable(),
    uncoveredStudentCount: z.number().int().nonnegative(),
    timeDiversityScore: z.number().min(0).max(1),
    maximumTeacherLoadRatio: z.number().nonnegative(),
    warningCount: z.number().int().nonnegative(),
    assignments: z.array(SchedulingDeterministicAssignmentSchema),
  })
  .superRefine((candidate, context) => {
    const assignmentKeys = candidate.assignments.map(
      ({ assignmentKey }) => assignmentKey
    )
    if (new Set(assignmentKeys).size !== assignmentKeys.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignments"],
      })
    }
  })

export type SchedulingDeterministicAssignment = z.infer<
  typeof SchedulingDeterministicAssignmentSchema
>
export type SchedulingDeterministicPlanCandidate = z.infer<
  typeof SchedulingDeterministicPlanCandidateSchema
>
