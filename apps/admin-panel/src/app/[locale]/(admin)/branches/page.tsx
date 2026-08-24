"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS, type BranchWithStats } from "@workspace/types"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { BranchesHeader } from "./components/branches-header"
import { BranchesTable } from "./components/branches-table"
import { CreateBranchModal } from "./components/create-branch-modal"
import { EditBranchModal } from "./components/edit-branch-modal"

export default function BranchesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] =
    React.useState<BranchWithStats | null>(null)

  const { activeInstituteId } = useActiveInstitute()

  const { data: branches, isLoading } = useQuery({
    ...branchesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: !!activeInstituteId,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_BRANCHES} mode="forbidden">
      <AdminPageShell
        header={<BranchesHeader onAddBranch={() => setCreateModalOpen(true)} />}
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
  )
}
