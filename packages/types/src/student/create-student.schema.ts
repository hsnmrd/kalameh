import { z } from "zod"
import { PhoneRegex } from "../common/index.js"

export const createCreateStudentSchema = (msg?: {
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
      .min(6, msg?.passwordMin ? { message: msg.passwordMin } : undefined)
      .optional(),
    nationalCode: z.string().trim().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    fatherName: z.string().trim().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    emergencyPhone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    currentAllowedCourseId: z.string().uuid().optional().nullable(),
    instituteId: z.string().uuid().optional(),
  })

export const CreateStudentSchema = createCreateStudentSchema()
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
