"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { OperatingPhaseWithSlots } from "@workspace/types"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  isOperatingPhaseCurrent,
  getCurrentJalaliMonth,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { OperatingPhasesTable } from "./components/operating-phases-table"
import { OperatingPhasesList } from "./components/operating-phases-list"
import { OperatingPhasesFilter } from "./components/operating-phases-filter"

export default function OperatingPhasesPage() {
  const t = useTranslations("operating-phases")
  const { openModal } = useModal()

  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const currentJalaliMonth = React.useMemo(() => getCurrentJalaliMonth(), [])

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: phases = [], isLoading } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const filteredPhases = React.useMemo(() => {
    return phases.filter((phase) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase()
        if (!phase.title.toLowerCase().includes(query)) {
          return false
        }
      }
      if (selectedStatus === "RUNNING") {
        return isOperatingPhaseCurrent(phase, currentJalaliMonth)
      }
      if (selectedStatus === "NOT_RUNNING") {
        return !isOperatingPhaseCurrent(phase, currentJalaliMonth)
      }
      return true
    })
  }, [phases, search, selectedStatus, currentJalaliMonth])

  const isListEmpty = !isLoading && filteredPhases.length === 0

  const handleCreate = () => openModal("createPhase")
  const handleEdit = (phase: OperatingPhaseWithSlots) =>
    openModal("editPhase", { phase })
  const handleDelete = (phase: OperatingPhaseWithSlots) =>
    openModal("deletePhase", { phase })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard
        permission={PERMISSIONS.VIEW_OPERATING_PHASES}
        mode="forbidden"
      >
        <AdminPageShell
          filters={
            <OperatingPhasesFilter
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
              permission={PERMISSIONS.MANAGE_OPERATING_PHASES}
              mode="hide"
            >
              <FABSingle onClick={handleCreate} aria-label={t("addPhase")} />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <OperatingPhasesTable
              phases={filteredPhases}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>

          {/* Mobile: Flat Divider List */}
          <div className="flex flex-1 flex-col lg:hidden">
            <OperatingPhasesList
              phases={filteredPhases}
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
