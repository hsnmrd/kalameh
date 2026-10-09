"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
  type ClassroomDto,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { classroomsResource, branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { ClassroomsTable } from "./components/classrooms-table"
import { ClassroomsList } from "./components/classrooms-list"
import { ClassroomsFilter } from "./components/classrooms-filter"

export default function ClassroomsPage() {
  const t = useTranslations("classrooms")
  const { openModal } = useModal()

  const [search, setSearch] = React.useState("")
  const [selectedBranchId, setSelectedBranchId] = React.useState("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const { data: classrooms = [], isLoading } = useQuery({
    ...classroomsResource.list.toQuery({
      instituteId: activeInstituteId,
      branchId: selectedBranchId !== "ALL" ? selectedBranchId : undefined,
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const isListEmpty = !isLoading && classrooms.length === 0

  const handleCreate = () => openModal("createClassroom")
  const handleEdit = (classroom: ClassroomDto) =>
    openModal("editClassroom", { classroom })
  const handleDelete = (classroom: ClassroomDto) =>
    openModal("deleteClassroom", { classroom })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard
        permission={PERMISSIONS.VIEW_CLASSROOMS}
        mode="forbidden"
      >
        <AdminPageShell
          filters={
            <ClassroomsFilter
              search={search}
              onSearchChange={setSearch}
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              branches={branches}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{
                branches,
              }}
            />
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSROOMS}
              mode="hide"
            >
              <FABSingle
                onClick={handleCreate}
                aria-label={t("addClassroom")}
              />
            </PermissionGuard>
          }
        >
          <div className="hidden lg:block">
            <ClassroomsTable
              classrooms={classrooms}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>

          <div className="flex flex-1 flex-col lg:hidden">
            <ClassroomsList
              classrooms={classrooms}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
