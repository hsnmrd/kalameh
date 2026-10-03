import { z } from "zod"
import { RoleEnum } from "../roles/index.js"
import { PhoneRegex, emptyToNull } from "../common/index.js"

export const createUpdateUserSchema = (msg?: {
  firstNameMin?: string
  lastNameMin?: string
  phoneRegex?: string
}) =>
  z.object({
    avatar: z.any().optional().nullable(),
    avatarUrl: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
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
    nationalCode: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .optional(),
    currentAllowedCourseId: z
      .preprocess(emptyToNull, z.string().uuid().nullable())
      .optional(),
  })

export const UpdateUserSchema = createUpdateUserSchema()
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
