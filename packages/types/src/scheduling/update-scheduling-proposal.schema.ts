import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  CLASS_DELIVERY_MODES,
  SCHEDULING_TIME_REGEX,
} from "./scheduling.constants.js"

export const UpdateSchedulingProposalSchema = z
  .object({
    title: z.string().trim().min(2).optional(),
    teacherId: z.string().uuid().optional(),
    branchId: z.string().uuid().nullable().optional(),
    classroomId: z.string().uuid().nullable().optional(),
    capacity: z.number().int().positive().optional(),
    deliveryMode: z.enum(CLASS_DELIVERY_MODES).optional(),
    daysOfWeek: z
      .array(z.enum(WEEK_DAYS))
      .min(1)
      .refine((days) => new Set(days).size === days.length)
      .optional(),
    startTime: z.string().regex(SCHEDULING_TIME_REGEX).optional(),
    endTime: z.string().regex(SCHEDULING_TIME_REGEX).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "at least one proposal field is required",
  })
  .superRefine((input, context) => {
    if (
      input.startTime !== undefined &&
      input.endTime !== undefined &&
      input.startTime >= input.endTime
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
      })
    }

    if (input.deliveryMode === "ONLINE" && input.classroomId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["classroomId"],
      })
    }
  })

export type UpdateSchedulingProposalInput = z.infer<
  typeof UpdateSchedulingProposalSchema
>
