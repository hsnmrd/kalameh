import { z } from "zod"
import { RoleEnum } from "../roles/index.js"

export const UserLookupResponseSchema = z.object({
  found: z.boolean(),
  user: z
    .object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string(),
      nationalCode: z.string().nullable().optional(),
      role: RoleEnum,
      fatherName: z.string().nullable().optional(),
      birthDate: z.string().nullable().optional(),
      gender: z.string().nullable().optional(),
      emergencyPhone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type UserLookupResponse = z.infer<typeof UserLookupResponseSchema>
