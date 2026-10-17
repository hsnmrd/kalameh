"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { TermDto } from "@workspace/types"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
} from "@workspace/types"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { TermsTable } from "./components/terms-table"
import { TermsList } from "./components/terms-list"
import { TermsFilter } from "./components/terms-filter"
import { TermsFabDrawer } from "./components/terms-fab-drawer"

export default function TermsPage() {
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        search: "",
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

  const { data: terms = [], isLoading } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      search: filters.search.trim() || undefined,
      isActive: parseStatusFilter(filters.selectedStatus),
      status:
        filters.selectedStatus !== "ALL" ? filters.selectedStatus : undefined,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const isListEmpty = !isLoading && terms.length === 0

  const handleCreate = () => openModal("createTerm")
  const handleBatch = () => openModal("generatePhaseTerms")
  const handleSettings = () => openModal("termSettingsModal")
  const handleView = (term: TermDto) => openModal("viewTerm", { term })
  const handleEdit = (term: TermDto) => openModal("editTerm", { term })
  const handleDelete = (term: TermDto) => openModal("deleteTerm", { term })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TERMS} mode="forbidden">
        <AdminPageShell
          filters={
            <TermsFilter
              search={filters.search}
              onSearchChange={(search) => setFilter("search", search)}
              selectedStatus={filters.selectedStatus}
              onStatusChange={(status) => setFilter("selectedStatus", status)}
              onAddClick={isListEmpty ? undefined : handleCreate}
              onBatchClick={isListEmpty ? undefined : handleBatch}
              onSettingsClick={handleSettings}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{
                allTerms: terms,
              }}
            />
          }
          fab={
            isListEmpty ? null : (
              <TermsFabDrawer
                onAddClick={handleCreate}
                onBatchClick={handleBatch}
              />
            )
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
              <TermsTable
                terms={terms}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleCreate}
                onBatch={handleBatch}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </React.Suspense>
          </div>

          {/* Mobile: flat divider list */}
          <div className="flex flex-1 flex-col lg:hidden">
            <React.Suspense fallback={<ListSkeleton rows={pageSize} />}>
              <TermsList
                terms={terms}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleCreate}
                onBatch={handleBatch}
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
