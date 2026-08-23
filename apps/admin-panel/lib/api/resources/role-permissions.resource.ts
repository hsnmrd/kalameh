import type {
  RolePermissionResponse,
  UpdateRolePermissions,
  ResetRolePermissions,
} from "@workspace/types"
import { api } from "../client"

export const rolePermissionsResource = api.resource("role-permissions", {
  list: api.get<RolePermissionResponse[], { instituteId?: string } | void>(
    "/role-permissions",
    {
      query: (params) => params || {},
    }
  ),
  detail: api.get<
    RolePermissionResponse,
    { role: string; instituteId?: string }
  >(({ role }) => `/role-permissions/${role}`, {
    query: ({ instituteId }) => (instituteId ? { instituteId } : {}),
  }),
  update: api.put<RolePermissionResponse, UpdateRolePermissions>(
    "/role-permissions"
  ),
  reset: api.post<RolePermissionResponse, ResetRolePermissions>(
    "/role-permissions/reset"
  ),
})
