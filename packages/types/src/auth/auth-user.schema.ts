import { z } from "zod"
import { RoleEnum } from "../roles/index.js"

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  role: RoleEnum,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  nationalCode: z.string().nullable().optional(),
  isActive: z.boolean(),
  currentAllowedCourseId: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type AuthUser = z.infer<typeof AuthUserSchema>
