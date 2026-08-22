import { z } from "zod"
import { StudentProfileSchema } from "./student-profile.schema.js"

export const StudentDtoSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  role: z.literal("STUDENT").default("STUDENT"),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  nationalCode: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  currentAllowedCourseId: z.string().nullable().optional(),
  currentAllowedCourse: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      baseFee: z.number().optional(),
    })
    .nullable()
    .optional(),
  studentProfile: StudentProfileSchema.nullable().optional(),
  enrollmentsCount: z.number().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})

export type StudentDto = z.infer<typeof StudentDtoSchema>
