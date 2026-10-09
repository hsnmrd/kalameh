"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { FABSingle } from "@workspace/ui/components/fab"
import type { TeacherDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { TeachersFilter } from "./components/teachers-filter"
import { TeachersTable } from "./components/teachers-table"
import { TeachersList } from "./components/teachers-list"

export default function TeachersPage() {
  const t = useTranslations("teachers")
  const { openModal } = useModal()

  const [searchValue, setSearchValue] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

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

  const isListEmpty = !isLoading && (!teachers || teachers.length === 0)

  const handleCreate = () => openModal("createTeacher")
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
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_TEACHERS}
              mode="hide"
            >
              <FABSingle onClick={handleCreate} aria-label={t("addTeacher")} />
            </PermissionGuard>
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
