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
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { ClassroomsTable } from "./components/classrooms-table"
import { ClassroomsList } from "./components/classrooms-list"
import { ClassroomsFilter } from "./components/classrooms-filter"

export default function ClassroomsPage() {
  const t = useTranslations("classrooms")
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        search: "",
        selectedBranchId: "ALL",
        selectedStatus: "ALL",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["search"],
    })

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
      branchId:
        filters.selectedBranchId !== "ALL"
          ? filters.selectedBranchId
          : undefined,
      search: filters.search.trim() || undefined,
      isActive: parseStatusFilter(filters.selectedStatus),
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
          isEmpty={isListEmpty}
          filters={
            <ClassroomsFilter
              isEmpty={isListEmpty}
              search={filters.search}
              onSearchChange={(search) => setFilter("search", search)}
              selectedBranchId={filters.selectedBranchId}
              onBranchChange={(branchId) =>
                setFilter("selectedBranchId", branchId)
              }
              selectedStatus={filters.selectedStatus}
              onStatusChange={(status) => setFilter("selectedStatus", status)}
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
            isListEmpty ? null : (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSROOMS}
                mode="hide"
              >
                <FABSingle
                  onClick={handleCreate}
                  aria-label={t("addClassroom")}
                />
              </PermissionGuard>
            )
          }
        >
          <div className="hidden lg:block">
            <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
              <ClassroomsTable
                classrooms={classrooms}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleCreate}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </React.Suspense>
          </div>

          <div className="flex flex-1 flex-col lg:hidden">
            <React.Suspense fallback={<ListSkeleton rows={pageSize} />}>
              <ClassroomsList
                classrooms={classrooms}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleCreate}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
              />
            </React.Suspense>
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
