"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PERMISSIONS, ROLES, APP_MODULES, type Role } from "@workspace/types"
import { rolePermissionsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { RolePermissionsEditor } from "./components/role-permissions-editor"
import { RolePermissionsStickyBar } from "./components/role-permissions-sticky-bar"
import { ResetRoleModal } from "./components/reset-role-modal"

export default function RolePermissionsPage() {
  const t = useTranslations("rolePermissions")
  const queryClient = useQueryClient()
  const { user } = usePermissions()
  const { activeInstitute, activeInstituteId } = useActiveInstitute()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.USERS_STAFF)

  const [selectedRole, setSelectedRole] = React.useState<Role>(ROLES.CLERK)
  const [resetModalOpen, setResetModalOpen] = React.useState(false)
  const [permissionDraft, setPermissionDraft] = React.useState<{
    sourceKey: string
    selected: Set<string>
    initial: Set<string>
  } | null>(null)

  // Query all role-permission records for the active institute
  const { data: rolePermissionsList, isLoading } = useQuery({
    ...rolePermissionsResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  // Find the currently selected role's record
  const currentRoleData = React.useMemo(() => {
    return rolePermissionsList?.find((item) => item.role === selectedRole)
  }, [rolePermissionsList, selectedRole])

  const sourceKey = React.useMemo(
    () =>
      `${activeInstituteId ?? ""}:${selectedRole}:${currentRoleData?.permissions.join(",") ?? ""}`,
    [activeInstituteId, currentRoleData?.permissions, selectedRole]
  )
  const sourcePermissions = React.useMemo(
    () => new Set(currentRoleData?.permissions ?? []),
    [currentRoleData?.permissions]
  )
  const activeDraft =
    permissionDraft?.sourceKey === sourceKey ? permissionDraft : null
  const selectedPermissions = activeDraft?.selected ?? sourcePermissions
  const initialPermissions = activeDraft?.initial ?? sourcePermissions

  const updateSelectedPermissions = React.useCallback(
    (update: (current: Set<string>) => Set<string>) => {
      setPermissionDraft((currentDraft) => {
        const isCurrentSource = currentDraft?.sourceKey === sourceKey
        return {
          sourceKey,
          selected: update(
            isCurrentSource ? currentDraft.selected : sourcePermissions
          ),
          initial: isCurrentSource
            ? currentDraft.initial
            : new Set(sourcePermissions),
        }
      })
    },
    [sourceKey, sourcePermissions]
  )

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
      setPermissionDraft({
        sourceKey,
        selected: permSet,
        initial: new Set(permSet),
      })
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
      setPermissionDraft({
        sourceKey,
        selected: permSet,
        initial: new Set(permSet),
      })
      queryClient.invalidateQueries({
        queryKey: rolePermissionsResource.list.baseKey(),
      })
    },
  })

  const handleTogglePermission = React.useCallback(
    (permission: string) => {
      updateSelectedPermissions((current) => {
        const next = new Set(current)
        if (next.has(permission)) {
          next.delete(permission)
        } else {
          next.add(permission)
        }
        return next
      })
    },
    [updateSelectedPermissions]
  )

  const handleToggleAllInModule = React.useCallback(
    (permissions: string[], selectAll: boolean) => {
      updateSelectedPermissions((current) => {
        const next = new Set(current)
        for (const permission of permissions) {
          if (selectAll) {
            next.add(permission)
          } else {
            next.delete(permission)
          }
        }
        return next
      })
    },
    [updateSelectedPermissions]
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
    setResetModalOpen(true)
  }

  const handleConfirmReset = () => {
    if (!activeInstituteId) return
    resetMutation.mutate(
      {
        role: selectedRole,
        instituteId: activeInstituteId,
      },
      {
        onSettled: () => setResetModalOpen(false),
      }
    )
  }

  return (
    <ModuleGuard module={APP_MODULES.USERS_STAFF}>
      <PermissionGuard
        permission={[
          PERMISSIONS.VIEW_ROLE_PERMISSIONS,
          PERMISSIONS.MANAGE_ROLE_PERMISSIONS,
        ]}
        mode="forbidden"
      >
        <AdminPageShell
          modals={
            <ResetRoleModal
              open={resetModalOpen}
              onClose={() => setResetModalOpen(false)}
              onConfirm={handleConfirmReset}
              isLoading={resetMutation.isPending}
            />
          }
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="size-8 text-primary" />
            </div>
          ) : (
            <>
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

              <RolePermissionsStickyBar
                onSave={handleSave}
                onReset={handleReset}
                isSaving={updateMutation.isPending}
                isResetting={resetMutation.isPending}
                hasChanges={hasChanges}
                selectedPermissionsCount={selectedPermissions.size}
              />
            </>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
