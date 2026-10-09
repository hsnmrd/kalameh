"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
  type BranchWithStats,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { BranchesTable } from "./components/branches-table"
import { BranchesList } from "./components/branches-list"
import { BranchesFilter } from "./components/branches-filter"

export default function BranchesPage() {
  const t = useTranslations("branches")
  const { openModal } = useModal()

  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: branches = [], isLoading } = useQuery({
    ...branchesResource.list.toQuery({
      instituteId: activeInstituteId,
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const isListEmpty = !isLoading && branches.length === 0

  const handleCreate = () => openModal("createBranch")
  const handleEdit = (branch: BranchWithStats) =>
    openModal("editBranch", { branch })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_BRANCHES} mode="forbidden">
        <AdminPageShell
          filters={
            <BranchesFilter
              search={search}
              onSearchChange={setSearch}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={<ModalGateway registry={modalRegistry} />}
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_BRANCHES}
              mode="hide"
            >
              <FABSingle onClick={handleCreate} aria-label={t("addBranch")} />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <BranchesTable
              branches={branches}
              isLoading={isLoading}
              onEdit={handleEdit}
              onAdd={handleCreate}
            />
          </div>

          {/* Mobile: flat divider list */}
          <div className="flex flex-1 flex-col lg:hidden">
            <BranchesList
              branches={branches}
              isLoading={isLoading}
              onEdit={handleEdit}
              onAdd={handleCreate}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
