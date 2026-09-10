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
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { OperatingPhasesTable } from "./components/operating-phases-table"
import { OperatingPhasesList } from "./components/operating-phases-list"
import { OperatingPhasesFilter } from "./components/operating-phases-filter"
import { CreateOperatingPhaseModal } from "./components/create-operating-phase-modal"
import { EditOperatingPhaseModal } from "./components/edit-operating-phase-modal"
import { DeleteOperatingPhaseModal } from "./components/delete-operating-phase-modal"

export default function OperatingPhasesPage() {
  const t = useTranslations("operating-phases")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingPhase, setEditingPhase] =
    React.useState<OperatingPhaseWithSlots | null>(null)
  const [deletingPhase, setDeletingPhase] =
    React.useState<OperatingPhaseWithSlots | null>(null)
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
              onAddClick={() => setCreateModalOpen(true)}
            />
          }
          modals={
            <>
              <CreateOperatingPhaseModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
              />

              <EditOperatingPhaseModal
                phase={editingPhase}
                open={Boolean(editingPhase)}
                onClose={() => setEditingPhase(null)}
              />

              <DeleteOperatingPhaseModal
                phase={deletingPhase}
                open={Boolean(deletingPhase)}
                onClose={() => setDeletingPhase(null)}
              />
            </>
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_OPERATING_PHASES}
              mode="hide"
            >
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addPhase")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <OperatingPhasesTable
              phases={filteredPhases}
              isLoading={isLoading}
              onEdit={(phase) => setEditingPhase(phase)}
              onDelete={(phase) => setDeletingPhase(phase)}
            />
          </div>

          {/* Mobile: Flat Divider List */}
          <div className="lg:hidden">
            <OperatingPhasesList
              phases={filteredPhases}
              isLoading={isLoading}
              onEdit={(phase) => setEditingPhase(phase)}
              onDelete={(phase) => setDeletingPhase(phase)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
