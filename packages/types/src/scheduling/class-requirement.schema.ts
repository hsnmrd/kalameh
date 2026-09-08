import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"

export interface ClassRequirementValidationMessages {
  cadenceRequired?: string
}

export const createClassRequirementInputSchema = (
  messages: ClassRequirementValidationMessages = {}
) =>
  z
    .object({
      termId: z.string().uuid(),
      courseId: z.string().uuid(),
      branchId: z.string().uuid().nullable().optional(),
      requiredClassCount: z.number().int().positive(),
      capacity: z.number().int().positive(),
      sessionDurationMinutes: z.number().int().positive(),
      sessionsPerWeek: z.number().int().positive().nullable().optional(),
      totalSessions: z.number().int().positive().nullable().optional(),
      deliveryMode: z.enum(CLASS_DELIVERY_MODES).default("IN_PERSON"),
      isActive: z.boolean().default(true),
    })
    .superRefine((requirement, context) => {
      const hasWeeklyCadence = requirement.sessionsPerWeek != null
      const hasTotalCadence = requirement.totalSessions != null

      if (hasWeeklyCadence === hasTotalCadence) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessionsPerWeek"],
          ...(messages.cadenceRequired
            ? { message: messages.cadenceRequired }
            : {}),
        })
      }
    })

export const ClassRequirementInputSchema = createClassRequirementInputSchema()

export const ClassRequirementSchema = z
  .object({
    id: z.string().uuid(),
    instituteId: z.string().uuid(),
    termId: z.string().uuid(),
    courseId: z.string().uuid(),
    branchId: z.string().uuid().nullable().optional(),
    requiredClassCount: z.number().int().positive(),
    capacity: z.number().int().positive(),
    sessionDurationMinutes: z.number().int().positive(),
    sessionsPerWeek: z.number().int().positive().nullable().optional(),
    totalSessions: z.number().int().positive().nullable().optional(),
    deliveryMode: z.enum(CLASS_DELIVERY_MODES),
    isActive: z.boolean(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()),
  })
  .superRefine((requirement, context) => {
    const hasWeeklyCadence = requirement.sessionsPerWeek != null
    const hasTotalCadence = requirement.totalSessions != null

    if (hasWeeklyCadence === hasTotalCadence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessionsPerWeek"],
      })
    }
  })

export type ClassRequirementInput = z.infer<typeof ClassRequirementInputSchema>
export type ClassRequirementDto = z.infer<typeof ClassRequirementSchema>
