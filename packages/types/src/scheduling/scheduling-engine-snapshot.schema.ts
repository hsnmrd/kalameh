import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import { STUDENT_SCHEDULE_STATUSES } from "../student/student-time-constraint.constants.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"
import { SchedulingTimeGroupSettingsSchema } from "./scheduling-time-group-settings.schema.js"

const snapshotDateSchema = z.coerce.date()

export const SchedulingEngineInputSnapshotSchema = z
  .object({
    schemaVersion: z.string().trim().min(1),
    request: z.object({
      termId: z.string().uuid(),
      branchId: z.string().uuid().nullable(),
      requirementIds: z.array(z.string().uuid()).min(1),
      alternativePlanCount: z.number().int().min(1).max(3),
    }),
    term: z.object({
      id: z.string().uuid(),
      startDate: snapshotDateSchema,
      endDate: snapshotDateSchema,
    }),
    requirements: z
      .array(
        z.object({
          id: z.string().uuid(),
          courseId: z.string().uuid(),
          branchId: z.string().uuid().nullable(),
          requiredClassCount: z.number().int().positive(),
          capacity: z.number().int().positive(),
          sessionDurationMinutes: z.number().int().positive(),
          deliveryMode: z.enum(CLASS_DELIVERY_MODES),
        })
      )
      .min(1),
    teachers: z.array(
      z.object({
        id: z.string().uuid(),
        courseId: z.string().uuid(),
        teacherProfile: z.object({
          userId: z.string().uuid(),
          user: z.object({
            isActive: z.boolean(),
            role: z.string().trim().min(1),
            branchId: z.string().uuid().nullable(),
          }),
          availabilities: z.array(
            z.object({
              id: z.string().uuid(),
              dayOfWeek: z.enum(WEEK_DAYS),
              startTime: z.string().regex(SCHEDULING_TIME_REGEX),
              endTime: z.string().regex(SCHEDULING_TIME_REGEX),
            })
          ),
        }),
      })
    ),
    students: z.array(
      z.object({
        id: z.string().uuid(),
        currentAllowedCourseId: z.string().uuid().nullable(),
        studentProfile: z
          .object({
            scheduleStatus: z.enum(STUDENT_SCHEDULE_STATUSES),
            timeConstraints: z.array(
              z.object({
                kind: z.enum(["UNAVAILABLE", "PREFERRED"]),
                dayOfWeek: z.enum(WEEK_DAYS),
                startTime: z.string().regex(SCHEDULING_TIME_REGEX),
                endTime: z.string().regex(SCHEDULING_TIME_REGEX),
                effectiveFrom: snapshotDateSchema.nullish(),
                effectiveUntil: snapshotDateSchema.nullish(),
              })
            ),
          })
          .nullable(),
      })
    ),
    existingClasses: z.array(
      z.object({
        id: z.string().uuid(),
        teacherId: z.string().uuid().nullable(),
        classroomId: z.string().uuid().nullable(),
        daysOfWeek: z.array(z.string()),
        sessionDates: z.array(z.string()),
        startTime: z.string().nullable(),
        endTime: z.string().nullable(),
      })
    ),
    classrooms: z.array(
      z.object({
        id: z.string().uuid(),
        branchId: z.string().uuid().nullable(),
        capacity: z.number().int().positive(),
        isActive: z.boolean().default(true),
      })
    ),
  })
  .superRefine((snapshot, context) => {
    const requestedIds = [...snapshot.request.requirementIds].sort()
    const requirementIds = snapshot.requirements.map(({ id }) => id).sort()
    if (
      snapshot.request.termId !== snapshot.term.id ||
      snapshot.term.startDate > snapshot.term.endDate ||
      new Set(requestedIds).size !== requestedIds.length ||
      new Set(requirementIds).size !== requirementIds.length ||
      requestedIds.join("|") !== requirementIds.join("|")
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["request"] })
    }
  })

export const SchedulingEngineSettingsSnapshotSchema = z
  .object({
    schemaVersion: z.string().trim().min(1),
    formulaVersion: z.string().trim().min(1),
    weights: z.object({
      studentCoverage: z.number().int().min(0).max(100),
      timeDiversity: z.number().int().min(0).max(100),
    }),
    timeGroups: SchedulingTimeGroupSettingsSchema,
    generation: z.object({
      candidateStepMinutes: z.number().int().min(5).max(60),
    }),
  })
  .superRefine((settings, context) => {
    if (
      settings.weights.studentCoverage + settings.weights.timeDiversity >
      100
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["weights"] })
    }
  })

export type SchedulingEngineInputSnapshot = z.infer<
  typeof SchedulingEngineInputSnapshotSchema
>
export type SchedulingEngineSettingsSnapshot = z.infer<
  typeof SchedulingEngineSettingsSnapshotSchema
>
