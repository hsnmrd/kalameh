import { z } from "zod"
import { AuthUserSchema } from "./auth-user.schema.js"

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
