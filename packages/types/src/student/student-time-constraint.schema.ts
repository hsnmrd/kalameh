import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import {
  STUDENT_TIME_CONSTRAINT_KINDS,
  STUDENT_TIME_CONSTRAINT_SOURCES,
} from "./student-time-constraint.constants.js"
import {
  STUDENT_TIME_REGEX,
  dateToTimestamp,
  isValidStudentEffectiveDate,
  timeToMinutes,
} from "./student-time-constraint.util.js"

export interface StudentTimeConstraintValidationMessages {
  startTimeFormat?: string
  endTimeFormat?: string
  invalidTimeRange?: string
  invalidDate?: string
  invalidEffectiveDateRange?: string
}

const createEffectiveDateSchema = (invalidDate?: string) =>
  z.union([
    z.date(),
    z.string().refine(
      (value) => {
        return isValidStudentEffectiveDate(value)
      },
      invalidDate ? { message: invalidDate } : undefined
    ),
  ])

export const createStudentTimeConstraintInputSchema = (
  messages: StudentTimeConstraintValidationMessages = {}
) =>
  z
    .object({
      id: z.string().uuid().optional(),
      kind: z.enum(STUDENT_TIME_CONSTRAINT_KINDS),
      source: z.enum(STUDENT_TIME_CONSTRAINT_SOURCES).default("OTHER"),
      dayOfWeek: z.enum(WEEK_DAYS),
      startTime: z
        .string()
        .regex(
          STUDENT_TIME_REGEX,
          messages.startTimeFormat
            ? { message: messages.startTimeFormat }
            : undefined
        ),
      endTime: z
        .string()
        .regex(
          STUDENT_TIME_REGEX,
          messages.endTimeFormat
            ? { message: messages.endTimeFormat }
            : undefined
        ),
      label: z
        .preprocess(
          (value) => (value === "" ? null : value),
          z.string().trim().max(120).nullable()
        )
        .optional(),
      effectiveFrom: createEffectiveDateSchema(messages.invalidDate)
        .nullable()
        .optional(),
      effectiveUntil: createEffectiveDateSchema(messages.invalidDate)
        .nullable()
        .optional(),
    })
    .superRefine((constraint, context) => {
      if (
        STUDENT_TIME_REGEX.test(constraint.startTime) &&
        STUDENT_TIME_REGEX.test(constraint.endTime) &&
        timeToMinutes(constraint.startTime) >= timeToMinutes(constraint.endTime)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          ...(messages.invalidTimeRange
            ? { message: messages.invalidTimeRange }
            : {}),
        })
      }

      if (
        constraint.effectiveFrom &&
        constraint.effectiveUntil &&
        dateToTimestamp(constraint.effectiveFrom, 0) >
          dateToTimestamp(constraint.effectiveUntil, 0)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["effectiveUntil"],
          ...(messages.invalidEffectiveDateRange
            ? { message: messages.invalidEffectiveDateRange }
            : {}),
        })
      }
    })

export const StudentTimeConstraintInputSchema =
  createStudentTimeConstraintInputSchema()

export const StudentTimeConstraintSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  studentProfileId: z.string().uuid(),
  kind: z.enum(STUDENT_TIME_CONSTRAINT_KINDS),
  source: z.enum(STUDENT_TIME_CONSTRAINT_SOURCES),
  dayOfWeek: z.enum(WEEK_DAYS),
  startTime: z.string().regex(STUDENT_TIME_REGEX),
  endTime: z.string().regex(STUDENT_TIME_REGEX),
  label: z.string().nullable().optional(),
  effectiveFrom: z.date().or(z.string()).nullable().optional(),
  effectiveUntil: z.date().or(z.string()).nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type StudentTimeConstraintInput = z.infer<
  typeof StudentTimeConstraintInputSchema
>
export type StudentTimeConstraintDto = z.infer<
  typeof StudentTimeConstraintSchema
>
