import { z } from "zod"
import { PhoneRegex, emptyToNull } from "../common/index.js"

export const createCreateStudentSchema = (msg?: {
  firstNameMin?: string
  lastNameMin?: string
  phoneRegex?: string
  passwordMin?: string
}) =>
  z.object({
    avatar: z.any().optional().nullable(),
    avatarUrl: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
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
    nationalCode: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
    fatherName: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
    birthDate: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    gender: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    emergencyPhone: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
    address: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
    notes: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
    currentAllowedCourseId: z
      .preprocess(emptyToNull, z.string().uuid().nullable())
      .optional(),
    instituteId: z.string().uuid().optional(),
  })

export const CreateStudentSchema = createCreateStudentSchema()
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
