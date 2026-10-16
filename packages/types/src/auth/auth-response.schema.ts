import { z } from "zod"
import { AuthUserSchema } from "./auth-user.schema.js"

export const UserInstituteOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  subdomain: z.string(),
  logoUrl: z.string().nullable().optional(),
})
export type UserInstituteOption = z.infer<typeof UserInstituteOptionSchema>

export const AuthResponseSchema = z.object({
  accessToken: z.string().optional(),
  user: AuthUserSchema.optional(),
  requiresInstituteSelection: z.boolean().optional(),
  institutes: z.array(UserInstituteOptionSchema).optional(),
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
