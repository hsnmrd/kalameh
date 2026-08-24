"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PERMISSIONS, ROLES, type Role } from "@workspace/types"
import { rolePermissionsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { RolePermissionsHeader } from "./components/role-permissions-header"
import { RolePermissionsEditor } from "./components/role-permissions-editor"

export default function RolePermissionsPage() {
  const t = useTranslations("rolePermissions")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [selectedRole, setSelectedRole] = React.useState<Role>(ROLES.CLERK)
  const [selectedPermissions, setSelectedPermissions] = React.useState<
    Set<string>
  >(new Set())
  const [initialPermissions, setInitialPermissions] = React.useState<
    Set<string>
  >(new Set())

  // Query all role-permission records for the active institute
  const { data: rolePermissionsList, isLoading } = useQuery({
    ...rolePermissionsResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: !!activeInstituteId,
  })

  // Find the currently selected role's record
  const currentRoleData = React.useMemo(() => {
    return rolePermissionsList?.find((item) => item.role === selectedRole)
  }, [rolePermissionsList, selectedRole])

  // Sync state when role changes or query data arrives
  React.useEffect(() => {
    if (currentRoleData) {
      const permSet = new Set(currentRoleData.permissions)
      setSelectedPermissions(permSet)
      setInitialPermissions(new Set(permSet))
    } else {
      setSelectedPermissions(new Set())
      setInitialPermissions(new Set())
    }
  }, [currentRoleData, selectedRole])

  // Track if there are unsaved local modifications
  const hasChanges = React.useMemo(() => {
    if (selectedPermissions.size !== initialPermissions.size) return true
    for (const p of selectedPermissions) {
      if (!initialPermissions.has(p)) return true
    }
    return false
  }, [selectedPermissions, initialPermissions])

  // Mutation: Update permissions
  const updateMutation = useMutation({
    ...rolePermissionsResource.update.toMutation(),
    onSuccess: (updated) => {
      toast.success(t("saveSuccess"))
      const permSet = new Set(updated.permissions)
      setSelectedPermissions(permSet)
      setInitialPermissions(new Set(permSet))
      queryClient.invalidateQueries({
        queryKey: rolePermissionsResource.list.baseKey(),
      })
    },
  })

  // Mutation: Reset to defaults
  const resetMutation = useMutation({
    ...rolePermissionsResource.reset.toMutation(),
    onSuccess: (resetResult) => {
      toast.success(t("resetSuccess"))
      const permSet = new Set(resetResult.permissions)
      setSelectedPermissions(permSet)
      setInitialPermissions(new Set(permSet))
      queryClient.invalidateQueries({
        queryKey: rolePermissionsResource.list.baseKey(),
      })
    },
  })

  const handleTogglePermission = React.useCallback((permission: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(permission)) {
        next.delete(permission)
      } else {
        next.add(permission)
      }
      return next
    })
  }, [])

  const handleToggleAllInModule = React.useCallback(
    (permissions: string[], selectAll: boolean) => {
      setSelectedPermissions((prev) => {
        const next = new Set(prev)
        for (const p of permissions) {
          if (selectAll) {
            next.add(p)
          } else {
            next.delete(p)
          }
        }
        return next
      })
    },
    []
  )

  const handleSave = () => {
    if (!activeInstituteId) return
    updateMutation.mutate({
      role: selectedRole,
      permissions: Array.from(selectedPermissions),
      instituteId: activeInstituteId,
    })
  }

  const handleReset = () => {
    if (!activeInstituteId) return
    if (window.confirm(t("resetConfirm"))) {
      resetMutation.mutate({
        role: selectedRole,
        instituteId: activeInstituteId,
      })
    }
  }

  return (
    <PermissionGuard
      permission={[
        PERMISSIONS.VIEW_ROLE_PERMISSIONS,
        PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
      ]}
      mode="forbidden"
    >
      <AdminPageShell
        header={
          <RolePermissionsHeader
            onSave={handleSave}
            onReset={handleReset}
            isSaving={updateMutation.isPending}
            isResetting={resetMutation.isPending}
            hasChanges={hasChanges}
          />
        }
      >
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : (
          <RolePermissionsEditor
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            rolePermissionsList={rolePermissionsList}
            currentRoleData={currentRoleData}
            selectedPermissions={selectedPermissions}
            onTogglePermission={handleTogglePermission}
            onToggleAllInModule={handleToggleAllInModule}
            disabled={updateMutation.isPending || resetMutation.isPending}
          />
        )}
      </AdminPageShell>
    </PermissionGuard>
  )
}
