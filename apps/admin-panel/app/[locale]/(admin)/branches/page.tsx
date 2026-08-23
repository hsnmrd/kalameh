"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { BranchWithStats } from "@workspace/types"
import { branchesResource } from "@/lib/api"
import { AdminPageShell } from "@/components/admin-page-shell"
import { BranchesHeader } from "./components/branches-header"
import { BranchesTable } from "./components/branches-table"
import { CreateBranchModal } from "./components/create-branch-modal"
import { EditBranchModal } from "./components/edit-branch-modal"

export default function BranchesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingBranch, setEditingBranch] =
    React.useState<BranchWithStats | null>(null)

  const { data: branches, isLoading } = useQuery(
    branchesResource.list.toQuery()
  )

  return (
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
  )
}
