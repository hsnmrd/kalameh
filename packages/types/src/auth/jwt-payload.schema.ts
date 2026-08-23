import { z } from "zod"
import { RoleEnum } from "../roles/index.js"

export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  phone: z.string(),
  role: RoleEnum,
  instituteId: z.string().uuid(),
  permissions: z.array(z.string()).optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type JwtPayload = z.infer<typeof JwtPayloadSchema>
