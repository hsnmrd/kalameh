import { z } from "zod"
import { RoleEnum } from "../roles/index.js"
import { PhoneRegex } from "../common/index.js"

export const createCreateUserSchema = (msg?: {
  firstNameMin?: string
  lastNameMin?: string
  phoneRegex?: string
  passwordMin?: string
}) =>
  z.object({
    firstName: z
      .string()
      .trim()
      .min(2, msg?.firstNameMin ? { message: msg.firstNameMin } : undefined),
    lastName: z
      .string()
      .trim()
      .min(2, msg?.lastNameMin ? { message: msg.lastNameMin } : undefined),
    phone: z
      .string()
      .trim()
      .regex(
        PhoneRegex,
        msg?.phoneRegex ? { message: msg.phoneRegex } : undefined
      ),
    password: z
      .string()
      .refine(
        (val) => !val || val.length === 0 || val.length >= 6,
        msg?.passwordMin ? { message: msg.passwordMin } : undefined
      )
      .optional(),
    role: RoleEnum.default("STUDENT"),
    nationalCode: z.string().trim().optional().nullable(),
    currentAllowedCourseId: z.string().uuid().optional().nullable(),
    instituteId: z.string().uuid().optional(),
  })

export const CreateUserSchema = createCreateUserSchema()
export type CreateUserInput = z.infer<typeof CreateUserSchema>
