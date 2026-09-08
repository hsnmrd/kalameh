import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_GROUPS,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"
import { SchedulingProposalSessionSchema } from "./scheduling-proposal-session.schema.js"
import { SchedulingScoreBreakdownSchema } from "./scheduling-score.schema.js"
import { SchedulingSelectionReasonSchema } from "./scheduling-selection-reason.schema.js"
import { SchedulingWarningSchema } from "./scheduling-warning.schema.js"

export const SchedulingProposalSchema = z
  .object({
    id: z.string().uuid(),
    instituteId: z.string().uuid(),
    planId: z.string().uuid(),
    classRequirementId: z.string().uuid().nullable().optional(),
    courseId: z.string().uuid(),
    branchId: z.string().uuid().nullable().optional(),
    teacherId: z.string().uuid(),
    classroomId: z.string().uuid().nullable().optional(),
    teacherQualificationId: z.string().uuid().nullable().optional(),
    qualificationCheckedAt: z.string().or(z.date()),
    publishedClassId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1),
    capacity: z.number().int().positive(),
    deliveryMode: z.enum(CLASS_DELIVERY_MODES),
    daysOfWeek: z.array(z.enum(WEEK_DAYS)).min(1),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX),
    timeGroup: z.enum(SCHEDULING_TIME_GROUPS).nullable().optional(),
    score: z.number().min(0).max(100).nullable().optional(),
    scoreBreakdown: SchedulingScoreBreakdownSchema,
    selectionReasons: z.array(SchedulingSelectionReasonSchema).default([]),
    scoredAt: z.string().or(z.date()).nullable().optional(),
    isLocked: z.boolean(),
    lockedByUserId: z.string().uuid().nullable().optional(),
    lockedAt: z.string().or(z.date()).nullable().optional(),
    isManuallyEdited: z.boolean(),
    editCount: z.number().int().nonnegative(),
    warnings: z
      .array(SchedulingWarningSchema)
      .nullish()
      .transform((warnings) => warnings ?? []),
    sessions: z.array(SchedulingProposalSessionSchema).default([]),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .superRefine((proposal, context) => {
    if (proposal.startTime >= proposal.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
      })
    }

    if (proposal.deliveryMode === "ONLINE" && proposal.classroomId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classroomId"],
      })
    }
  })

export type SchedulingProposalDto = z.infer<typeof SchedulingProposalSchema>
