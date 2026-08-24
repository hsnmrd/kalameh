"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { TermDto } from "@workspace/types"
import { PERMISSIONS } from "@workspace/types"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { TermsHeader } from "./components/terms-header"
import { TermsTable } from "./components/terms-table"
import { CreateTermModal } from "./components/create-term-modal"
import { EditTermModal } from "./components/edit-term-modal"

export default function TermsPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingTerm, setEditingTerm] = React.useState<TermDto | null>(null)

  const { activeInstituteId } = useActiveInstitute()

  const { data: terms, isLoading } = useQuery({
    ...termsResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: !!activeInstituteId,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_TERMS} mode="forbidden">
      <AdminPageShell
        header={<TermsHeader onAddTerm={() => setCreateModalOpen(true)} />}
        modals={
          <>
            <CreateTermModal
              open={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
            />

            <EditTermModal
              term={editingTerm}
              open={Boolean(editingTerm)}
              onClose={() => setEditingTerm(null)}
            />
          </>
        }
      >
        <TermsTable
          terms={terms}
          isLoading={isLoading}
          onEdit={(term) => setEditingTerm(term)}
        />
      </AdminPageShell>
    </PermissionGuard>
  )
}
