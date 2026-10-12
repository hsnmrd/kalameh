"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "@workspace/ui/components/sonner"
import { FABSingle } from "@workspace/ui/components/fab"
import type { TeacherDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { teachersResource, API_BASE_URL } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { TeachersHeaderActions } from "./components/teachers-header-actions"
import { TeachersFilter } from "./components/teachers-filter"
import { TeachersTable } from "./components/teachers-table"
import { TeachersList } from "./components/teachers-list"

export default function TeachersPage() {
  const t = useTranslations("teachers")
  const locale = useLocale()
  const { openModal } = useModal()

  const [searchValue, setSearchValue] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")
  const [isExporting, setIsExporting] = React.useState(false)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const isActiveFilter =
    selectedStatus === "ACTIVE"
      ? true
      : selectedStatus === "INACTIVE"
        ? false
        : undefined

  const { data: teachers, isLoading } = useQuery({
    ...teachersResource.list.toQuery({
      search: searchValue.trim() || undefined,
      isActive: isActiveFilter,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const totalCount = teachers?.length ?? 0
  const isListEmpty = !isLoading && totalCount === 0

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseUrl = API_BASE_URL
      const queryParams = new URLSearchParams()
      if (isActiveFilter !== undefined)
        queryParams.set("isActive", String(isActiveFilter))
      if (searchValue.trim()) queryParams.set("search", searchValue.trim())
      if (activeInstituteId) queryParams.set("instituteId", activeInstituteId)

      const url = `${baseUrl}/teachers/export-excel?${queryParams.toString()}`
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
      a.download = "teachers-list.xlsx"
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

  const handleCreate = () => openModal("createTeacher")
  const handleImport = () => openModal("importTeachers")
  const handleViewProfile = (teacher: TeacherDto) =>
    openModal("viewProfileTeacher", { teacher })
  const handleManageAvailability = (teacher: TeacherDto) =>
    openModal("availabilityTeacher", { teacher })
  const handleEdit = (teacher: TeacherDto) =>
    openModal("editTeacher", { teacher })
  const handleResetPassword = (teacher: TeacherDto) =>
    openModal("resetPasswordTeacher", { teacher })
  const handleDelete = (teacher: TeacherDto) =>
    openModal("deleteTeacher", { teacher })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TEACHERS} mode="forbidden">
        <AdminPageShell
          actions={
            <TeachersHeaderActions
              totalCount={totalCount}
              onImportClick={handleImport}
              onExportClick={handleExport}
              isExporting={isExporting}
            />
          }
          filter={
            <TeachersFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{
                instituteId: activeInstituteId,
                onEdit: handleEdit,
                onManageAvailability: handleManageAvailability,
                onResetPassword: handleResetPassword,
              }}
            />
          }
          fab={
            isListEmpty ? null : (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_TEACHERS}
                mode="hide"
              >
                <FABSingle
                  onClick={handleCreate}
                  aria-label={t("addTeacher")}
                />
              </PermissionGuard>
            )
          }
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <TeachersTable
              teachers={teachers}
              isLoading={isLoading}
              onViewProfile={handleViewProfile}
              onEdit={handleEdit}
              onManageAvailability={handleManageAvailability}
              onResetPassword={handleResetPassword}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>

          {/* Mobile Flat List View */}
          <div className="flex flex-1 flex-col lg:hidden">
            <TeachersList
              teachers={teachers}
              isLoading={isLoading}
              onViewProfile={handleViewProfile}
              onEdit={handleEdit}
              onManageAvailability={handleManageAvailability}
              onResetPassword={handleResetPassword}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
