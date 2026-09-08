import { z } from "zod"
import { CLASS_DELIVERY_MODES } from "./scheduling.constants.js"

const parseActiveStatus = (value: unknown): unknown => {
  if (value === true || value === "true" || value === "ACTIVE") return true
  if (value === false || value === "false" || value === "INACTIVE") return false
  if (value === undefined || value === "ALL") return undefined
  return value
}

export const ClassRequirementFilterSchema = z.object({
  instituteId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  branchId: z
    .union([z.string().uuid(), z.literal("NONE")])
    .transform((value) => (value === "NONE" ? null : value))
    .optional(),
  deliveryMode: z.enum(CLASS_DELIVERY_MODES).optional(),
  isActive: z.preprocess(parseActiveStatus, z.boolean().optional()),
})

export type ClassRequirementFilter = z.infer<
  typeof ClassRequirementFilterSchema
>
