import { z } from "zod"
import { RoleEnum } from "../roles/index.js"
import { PhoneRegex } from "../common/index.js"

export const createUpdateUserSchema = (msg?: {
  firstNameMin?: string
  lastNameMin?: string
  phoneRegex?: string
}) =>
  z.object({
    firstName: z
      .string()
      .trim()
      .min(2, msg?.firstNameMin ? { message: msg.firstNameMin } : undefined)
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(2, msg?.lastNameMin ? { message: msg.lastNameMin } : undefined)
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(
        PhoneRegex,
        msg?.phoneRegex ? { message: msg.phoneRegex } : undefined
      )
      .optional(),
    role: RoleEnum.optional(),
    nationalCode: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
    currentAllowedCourseId: z.string().uuid().optional().nullable(),
  })

export const UpdateUserSchema = createUpdateUserSchema()
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
