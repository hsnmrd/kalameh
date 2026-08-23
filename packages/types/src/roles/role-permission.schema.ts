import { z } from "zod"
import { RoleEnum } from "./role.enum.js"

export const UpdateRolePermissionsSchema = z.object({
  role: RoleEnum,
  permissions: z.array(z.string()),
  instituteId: z.string().uuid().optional(),
})
export type UpdateRolePermissions = z.infer<typeof UpdateRolePermissionsSchema>

export const ResetRolePermissionsSchema = z.object({
  role: RoleEnum,
  instituteId: z.string().uuid().optional(),
})
export type ResetRolePermissions = z.infer<typeof ResetRolePermissionsSchema>

export const RolePermissionResponseSchema = z.object({
  role: RoleEnum,
  permissions: z.array(z.string()),
  isOverridden: z.boolean(),
})
export type RolePermissionResponse = z.infer<
  typeof RolePermissionResponseSchema
>
