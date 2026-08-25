"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "@workspace/ui/components/sonner"
import type { AuthUser } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { UsersHeader } from "./components/users-header"
import { UsersFilter } from "./components/users-filter"
import { UsersTable } from "./components/users-table"
import { CreateUserModal } from "./components/create-user-modal"
import { EditUserModal } from "./components/edit-user-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"
import { ImportUsersModal } from "./components/import-users-modal"
import { DeleteUserModal } from "./components/delete-user-modal"

export default function UsersPage() {
  const t = useTranslations("users")
  const locale = useLocale()
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState("")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [editUser, setEditUser] = React.useState<AuthUser | null>(null)
  const [deleteUser, setDeleteUser] = React.useState<AuthUser | null>(null)
  const [resetPasswordUser, setResetPasswordUser] =
    React.useState<AuthUser | null>(null)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.USERS_STAFF)

  // Fetch users with filters (and scoped to active institute for Super Admin / Institute Admin)
  const { data: users, isLoading } = useQuery({
    ...usersResource.list.toQuery({
      role: selectedRole || undefined,
      search: searchValue.trim() || undefined,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const totalCount = users?.length ?? 0

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const queryParams = new URLSearchParams()
      if (selectedRole) queryParams.set("role", selectedRole)
      if (searchValue.trim()) queryParams.set("search", searchValue.trim())
      if (activeInstituteId) queryParams.set("instituteId", activeInstituteId)

      const url = `${baseUrl}/users/export-excel?${queryParams.toString()}`
      const response = await fetch(url, {
        headers: {
          "Accept-Language": locale,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to export")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = "users-list.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch {
      toast.error(t("export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <ModuleGuard module={APP_MODULES.USERS_STAFF}>
      <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="forbidden">
        <AdminPageShell
          header={
            <UsersHeader
              totalCount={totalCount}
              onAddUserClick={() => setCreateModalOpen(true)}
              onImportClick={() => setImportModalOpen(true)}
              onExportClick={handleExport}
              isExporting={isExporting}
            />
          }
          filter={
            <UsersFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
            />
          }
          modals={
            <>
              {/* Create User Modal */}
              <CreateUserModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                instituteId={activeInstituteId}
              />

              {/* Import Users from Excel Modal */}
              <ImportUsersModal
                open={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                instituteId={activeInstituteId}
              />

              {/* Edit User Modal */}
              <EditUserModal
                user={editUser}
                open={Boolean(editUser)}
                onClose={() => setEditUser(null)}
              />

              {/* Reset Password Modal */}
              <ResetPasswordModal
                user={resetPasswordUser}
                open={Boolean(resetPasswordUser)}
                onClose={() => setResetPasswordUser(null)}
              />

              {/* Delete User Modal */}
              <DeleteUserModal
                user={deleteUser}
                open={Boolean(deleteUser)}
                onClose={() => setDeleteUser(null)}
              />
            </>
          }
        >
          {/* Users Data Table / Mobile Cards */}
          <UsersTable
            users={users}
            isLoading={isLoading}
            onEdit={(user) => setEditUser(user)}
            onResetPassword={(user) => setResetPasswordUser(user)}
            onDelete={(user) => setDeleteUser(user)}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
