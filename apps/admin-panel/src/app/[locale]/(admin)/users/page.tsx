"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { UserPlus, FileSpreadsheet, Download } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@workspace/ui/components/drawer"
import { FABSingle } from "@workspace/ui/components/fab"
import { Spinner } from "@workspace/ui/components/spinner"
import type { AuthUser } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { UsersHeaderActions } from "./components/users-header-actions"
import { UsersFilter } from "./components/users-filter"
import { UsersTable } from "./components/users-table"
import { UsersList } from "./components/users-list"
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
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
          actions={
            <UsersHeaderActions
              totalCount={totalCount}
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

              {/* Mobile Actions Drawer (from header three-dot button) */}
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{t("title")}</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_USERS}
                      mode="hide"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          setImportModalOpen(true)
                        }}
                        className="h-12 w-full justify-start gap-3 rounded-xl px-4 text-base font-medium"
                      >
                        <FileSpreadsheet className="size-5 text-emerald-600" />
                        <span>{t("importModal.trigger")}</span>
                      </Button>
                    </PermissionGuard>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleExport()
                      }}
                      disabled={isExporting}
                      className="h-12 w-full justify-start gap-3 rounded-xl px-4 text-base font-medium"
                    >
                      {isExporting ? (
                        <Spinner className="size-5 text-primary" />
                      ) : (
                        <Download className="size-5 text-sky-600" />
                      )}
                      <span>{t("export.trigger")}</span>
                    </Button>
                  </div>
                  <DrawerFooter>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("close") || "بستن"}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </>
          }
          fab={
            <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addUser")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <UsersTable
              users={users}
              isLoading={isLoading}
              onEdit={(user) => setEditUser(user)}
              onResetPassword={(user) => setResetPasswordUser(user)}
              onDelete={(user) => setDeleteUser(user)}
            />
          </div>

          {/* Mobile Flat List View */}
          <div className="lg:hidden">
            <UsersList
              users={users}
              isLoading={isLoading}
              onEdit={(user) => setEditUser(user)}
              onResetPassword={(user) => setResetPasswordUser(user)}
              onDelete={(user) => setDeleteUser(user)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
