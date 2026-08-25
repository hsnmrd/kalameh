"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  type BranchWithStats,
} from "@workspace/types"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { BranchesHeader } from "./components/branches-header"
import { BranchesTable } from "./components/branches-table"
import { CreateBranchModal } from "./components/create-branch-modal"
import { EditBranchModal } from "./components/edit-branch-modal"

export default function BranchesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] =
    React.useState<BranchWithStats | null>(null)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: branches, isLoading } = useQuery({
    ...branchesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_BRANCHES} mode="forbidden">
        <AdminPageShell
          header={
            <BranchesHeader onAddBranch={() => setCreateModalOpen(true)} />
          }
          modals={
            <>
              <CreateBranchModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
              />

              <EditBranchModal
                branch={editingBranch}
                open={Boolean(editingBranch)}
                onClose={() => setEditingBranch(null)}
              />
            </>
          }
        >
          <BranchesTable
            branches={branches}
            isLoading={isLoading}
            onEdit={(branch) => setEditingBranch(branch)}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
