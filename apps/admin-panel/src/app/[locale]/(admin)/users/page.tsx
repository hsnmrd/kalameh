"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "@workspace/ui/components/sonner"
import { FABSingle } from "@workspace/ui/components/fab"
import type { AuthUser } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { usersResource, API_BASE_URL } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { UsersHeaderActions } from "./components/users-header-actions"
import { UsersFilter } from "./components/users-filter"
import { UsersTable } from "./components/users-table"
import { UsersList } from "./components/users-list"

export default function UsersPage() {
  const t = useTranslations("users")
  const locale = useLocale()
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        searchValue: "",
        selectedRole: "ALL",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["searchValue"],
    })
  const [isExporting, setIsExporting] = React.useState(false)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.USERS_STAFF)

  const effectiveRoleFilter =
    filters.selectedRole && filters.selectedRole !== "ALL"
      ? filters.selectedRole
      : undefined

  const { data: users, isLoading } = useQuery({
    ...usersResource.list.toQuery({
      role: effectiveRoleFilter,
      search: filters.searchValue.trim() || undefined,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const totalCount = users?.length ?? 0
  const isListEmpty = !isLoading && totalCount === 0

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseUrl = API_BASE_URL
      const queryParams = new URLSearchParams()
      if (effectiveRoleFilter) queryParams.set("role", effectiveRoleFilter)
      if (filters.searchValue.trim())
        queryParams.set("search", filters.searchValue.trim())
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

  const handleCreate = () => openModal("createUser")
  const handleImport = () => openModal("importUsers")
  const handleViewProfile = (authUser: AuthUser) =>
    openModal("profileUser", { user: authUser })
  const handleEdit = (authUser: AuthUser) =>
    openModal("editUser", { user: authUser })
  const handleResetPassword = (authUser: AuthUser) =>
    openModal("resetPasswordUser", { user: authUser })
  const handleDelete = (authUser: AuthUser) =>
    openModal("deleteUser", { user: authUser })

  return (
    <ModuleGuard module={APP_MODULES.USERS_STAFF}>
      <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="forbidden">
        <AdminPageShell
          actions={
            <UsersHeaderActions
              totalCount={totalCount}
              onImportClick={handleImport}
              onExportClick={handleExport}
              isExporting={isExporting}
            />
          }
          filter={
            <UsersFilter
              searchValue={filters.searchValue}
              onSearchChange={(search) => setFilter("searchValue", search)}
              selectedRole={filters.selectedRole}
              onRoleChange={(role) => setFilter("selectedRole", role)}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{
                instituteId: activeInstituteId,
                onEdit: handleEdit,
                onResetPassword: handleResetPassword,
                onDelete: handleDelete,
              }}
            />
          }
          fab={
            isListEmpty ? null : (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_USERS}
                mode="hide"
              >
                <FABSingle onClick={handleCreate} aria-label={t("addUser")} />
              </PermissionGuard>
            )
          }
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <UsersTable
              users={users}
              isLoading={isLoading}
              onViewProfile={handleViewProfile}
              onEdit={handleEdit}
              onResetPassword={handleResetPassword}
              onDelete={handleDelete}
              onAdd={handleCreate}
              pageIndex={pageIndex}
              pageSize={pageSize}
              onPageIndexChange={setPageIndex}
              onPageSizeChange={setPageSize}
            />
          </div>

          {/* Mobile Flat List View */}
          <div className="flex flex-1 flex-col lg:hidden">
            <UsersList
              users={users}
              isLoading={isLoading}
              onViewProfile={handleViewProfile}
              onEdit={handleEdit}
              onResetPassword={handleResetPassword}
              onDelete={handleDelete}
              onAdd={handleCreate}
              pageIndex={pageIndex}
              pageSize={pageSize}
              onPageChange={setPageIndex}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
