import { z } from "zod"
import { PhoneRegex } from "../common/index.js"

export const createUpdateStudentSchema = (msg?: {
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
    nationalCode: z.string().trim().optional().nullable(),
    avatarUrl: z.string().optional().nullable(),
    fatherName: z.string().trim().optional().nullable(),
    birthDate: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    emergencyPhone: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
    currentAllowedCourseId: z.string().uuid().optional().nullable(),
  })

export const UpdateStudentSchema = createUpdateStudentSchema()
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>
