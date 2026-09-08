import { z } from "zod"
import { PhoneRegex, emptyToNull } from "../common/index.js"
import { TeacherAvailabilityInputSchema } from "./teacher-availability.schema.js"
import { TeacherCourseIdsInputSchema } from "./teacher-course-qualification.schema.js"

export const createUpdateTeacherSchema = (msg?: {
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
    nationalCode: z
      .preprocess(emptyToNull, z.string().trim().nullable())
      .optional(),
    bio: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
    degree: z.preprocess(emptyToNull, z.string().trim().nullable()).optional(),
    specialties: z.array(z.string()).optional(),
    availabilities: z.array(TeacherAvailabilityInputSchema).optional(),
    courseIds: TeacherCourseIdsInputSchema.optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .optional(),
  })

export const UpdateTeacherSchema = createUpdateTeacherSchema()
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>
