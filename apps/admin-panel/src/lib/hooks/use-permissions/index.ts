"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  type Permission,
  type Role,
  type AuthUser,
  hasPermission as checkHasPermission,
} from "@workspace/types"
import { authResource } from "@/lib/api"

export interface UsePermissionsResult {
  user?: AuthUser
  role?: Role
  permissions: readonly string[]
  isLoading: boolean
  hasPermission: (
    permission: Permission | readonly Permission[],
    requireAll?: boolean
  ) => boolean
}

export function usePermissions(): UsePermissionsResult {
  const { data: user, isLoading } = useQuery(authResource.me.toQuery())

  const hasPermission = React.useCallback(
    (
      permission: Permission | readonly Permission[],
      requireAll = false
    ): boolean => {
      if (!user) return false
      return checkHasPermission(user, permission, requireAll)
    },
    [user]
  )

  const permissions = React.useMemo<readonly string[]>(() => {
    return user?.permissions ?? []
  }, [user])

  return {
    user,
    role: user?.role,
    permissions,
    isLoading,
    hasPermission,
  }
}
