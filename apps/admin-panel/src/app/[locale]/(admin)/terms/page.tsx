"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { TermDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { TermsHeader } from "./components/terms-header"
import { TermsTable } from "./components/terms-table"
import { CreateTermModal } from "./components/create-term-modal"
import { EditTermModal } from "./components/edit-term-modal"

export default function TermsPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingTerm, setEditingTerm] = React.useState<TermDto | null>(null)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: terms, isLoading } = useQuery({
    ...termsResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
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
    </ModuleGuard>
  )
}
