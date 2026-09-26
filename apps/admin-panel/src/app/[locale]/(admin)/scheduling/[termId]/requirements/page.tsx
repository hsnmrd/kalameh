"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { CreateRequirementModal } from "./components/create-requirement-modal"
import { DeleteRequirementModal } from "./components/delete-requirement-modal"
import { EditRequirementModal } from "./components/edit-requirement-modal"
import { RequirementsFilter } from "./components/requirements-filter"
import { RequirementsList } from "./components/requirements-list"
import { RequirementsTable } from "./components/requirements-table"
import { SyncDemandModal } from "./components/sync-demand-modal"
import { useRequirementsData } from "./hooks/use-requirements-data"

export default function TermRequirementsPage() {
  const t = useTranslations("scheduling")
  const params = useParams()
  const termId = (params.termId as string) || ""
  const [branchId, setBranchId] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isSyncOpen, setIsSyncOpen] = React.useState(false)
  const [editingItem, setEditingItem] =
    React.useState<ClassRequirementDto | null>(null)
  const [deletingItem, setDeletingItem] =
    React.useState<ClassRequirementDto | null>(null)
  const data = useRequirementsData({
    termId,
    branchId,
    onCreated: () => setIsCreateOpen(false),
    onUpdated: () => setEditingItem(null),
    onDeleted: () => setDeletingItem(null),
    onSynced: () => setIsSyncOpen(false),
  })
  const currentTerm = React.useMemo(
    () => data.terms?.find((term) => term.id === termId),
    [data.terms, termId]
  )
  const filteredItems = React.useMemo(() => {
    const list = data.requirements ?? []
    if (!search.trim()) return list
    const query = search.trim().toLowerCase()
    return list.filter((item) =>
      item.course?.title?.toLowerCase().includes(query)
    )
  }, [data.requirements, search])

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref={`/scheduling/${termId}`}
              backLabel={t("requirementsPage.actions.backToScheduling")}
              items={[
                { label: t("title"), href: "/scheduling" },
                {
                  label: currentTerm?.title ?? "...",
                  href: `/scheduling/${termId}`,
                },
                { label: t("requirementsPage.title") },
              ]}
            />
          }
          filter={
            <RequirementsFilter
              search={search}
              onSearchChange={setSearch}
              branchId={branchId}
              onBranchChange={setBranchId}
              onAddClick={() => setIsCreateOpen(true)}
              onSyncDemandClick={() => setIsSyncOpen(true)}
              isSyncing={data.isSyncing}
            />
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSES}
              mode="hide"
            >
              <FABSingle
                onClick={() => setIsCreateOpen(true)}
                aria-label={t("requirementsPage.addRequirement")}
              >
                <Plus className="size-6" aria-hidden />
              </FABSingle>
            </PermissionGuard>
          }
        >
          <div className="hidden lg:block">
            <RequirementsTable
              items={filteredItems}
              isLoading={data.isLoading}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          </div>
          <div className="lg:hidden">
            <RequirementsList
              items={filteredItems}
              isLoading={data.isLoading}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          </div>
          <CreateRequirementModal
            termId={termId}
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSave={data.create}
            isSaving={data.isCreating}
          />
          <EditRequirementModal
            item={editingItem}
            open={Boolean(editingItem)}
            onClose={() => setEditingItem(null)}
            onSave={data.update}
            isSaving={data.isUpdating}
          />
          <DeleteRequirementModal
            item={deletingItem}
            open={Boolean(deletingItem)}
            onClose={() => setDeletingItem(null)}
            onConfirm={data.remove}
            isDeleting={data.isDeleting}
          />
          <SyncDemandModal
            open={isSyncOpen}
            onClose={() => setIsSyncOpen(false)}
            onConfirm={data.sync}
            isSyncing={data.isSyncing}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
