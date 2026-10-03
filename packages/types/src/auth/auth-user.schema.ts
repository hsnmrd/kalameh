import { z } from "zod"
import { RoleEnum } from "../roles/index.js"
import { StudentProfileSchema } from "../student/student-profile.schema.js"
import { InstituteSchema } from "../institute/institute.schema.js"

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  role: RoleEnum,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  nationalCode: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  currentAllowedCourseId: z.string().nullable().optional(),
  studentProfile: StudentProfileSchema.nullable().optional(),
  institute: InstituteSchema.nullable().optional(),
  permissions: z.array(z.string()).optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type AuthUser = z.infer<typeof AuthUserSchema>
