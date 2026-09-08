import { z } from "zod"
import { STUDENT_SCHEDULE_STATUSES } from "./student-time-constraint.constants.js"
import {
  createStudentTimeConstraintInputSchema,
  type StudentTimeConstraintValidationMessages,
} from "./student-time-constraint.schema.js"
import {
  studentConstraintDateRangesOverlap,
  studentConstraintTimesOverlap,
} from "./student-time-constraint.util.js"

export interface StudentTimeProfileValidationMessages extends StudentTimeConstraintValidationMessages {
  overlappingConstraints?: string
  preferenceOverlapsUnavailable?: string
  invalidConstraintsPayload?: string
}

const parseConstraints = (value: unknown): unknown => {
  if (value === undefined || Array.isArray(value)) return value
  if (typeof value !== "string") return value

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export const createReplaceStudentTimeProfileSchema = (
  messages: StudentTimeProfileValidationMessages = {}
) =>
  z
    .object({
      scheduleStatus: z.enum(STUDENT_SCHEDULE_STATUSES),
      constraints: z.preprocess(
        parseConstraints,
        z.array(
          createStudentTimeConstraintInputSchema(messages),
          messages.invalidConstraintsPayload
            ? { invalid_type_error: messages.invalidConstraintsPayload }
            : undefined
        )
      ),
    })
    .superRefine((profile, context) => {
      for (
        let firstIndex = 0;
        firstIndex < profile.constraints.length;
        firstIndex += 1
      ) {
        const first = profile.constraints[firstIndex]
        if (!first) continue

        for (
          let secondIndex = firstIndex + 1;
          secondIndex < profile.constraints.length;
          secondIndex += 1
        ) {
          const second = profile.constraints[secondIndex]
          if (!second) continue
          if (!studentConstraintTimesOverlap(first, second)) continue
          if (!studentConstraintDateRangesOverlap(first, second)) continue

          const sameKind = first.kind === second.kind
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["constraints", secondIndex],
            ...(sameKind && messages.overlappingConstraints
              ? { message: messages.overlappingConstraints }
              : !sameKind && messages.preferenceOverlapsUnavailable
                ? { message: messages.preferenceOverlapsUnavailable }
                : {}),
          })
        }
      }
    })

export const ReplaceStudentTimeProfileSchema =
  createReplaceStudentTimeProfileSchema()

export type ReplaceStudentTimeProfileInput = z.infer<
  typeof ReplaceStudentTimeProfileSchema
>
