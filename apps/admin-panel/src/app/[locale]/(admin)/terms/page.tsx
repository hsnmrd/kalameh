"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { TermDto } from "@workspace/types"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { TermsTable } from "./components/terms-table"
import { TermsList } from "./components/terms-list"
import { TermsFilter } from "./components/terms-filter"
import { CreateTermModal } from "./components/create-term-modal"
import { EditTermModal } from "./components/edit-term-modal"
import { GeneratePhaseTermsModal } from "./components/generate-phase-terms-modal"
import { DeleteTermModal } from "./components/delete-term-modal"

export default function TermsPage() {
  const t = useTranslations("terms")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [batchModalOpen, setBatchModalOpen] = React.useState(false)
  const [editingTerm, setEditingTerm] = React.useState<TermDto | null>(null)
  const [deletingTerm, setDeletingTerm] = React.useState<TermDto | null>(null)
  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: terms = [], isLoading } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
      status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TERMS} mode="forbidden">
        <AdminPageShell
          filters={
            <TermsFilter
              search={search}
              onSearchChange={setSearch}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onAddClick={() => setCreateModalOpen(true)}
              onBatchClick={() => setBatchModalOpen(true)}
            />
          }
          modals={
            <>
              <CreateTermModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
              />

              <GeneratePhaseTermsModal
                key={String(batchModalOpen)}
                open={batchModalOpen}
                onClose={() => setBatchModalOpen(false)}
              />

              <EditTermModal
                term={editingTerm}
                open={Boolean(editingTerm)}
                onClose={() => setEditingTerm(null)}
              />

              <DeleteTermModal
                term={deletingTerm}
                open={Boolean(deletingTerm)}
                onClose={() => setDeletingTerm(null)}
              />
            </>
          }
          fab={
            <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="hide">
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addTerm")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <TermsTable
              terms={terms}
              isLoading={isLoading}
              onEdit={(term) => setEditingTerm(term)}
              onDelete={(term) => setDeletingTerm(term)}
            />
          </div>

          {/* Mobile: flat divider list */}
          <div className="lg:hidden">
            <TermsList
              terms={terms}
              isLoading={isLoading}
              onEdit={(term) => setEditingTerm(term)}
              onDelete={(term) => setDeletingTerm(term)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
