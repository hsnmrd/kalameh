"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { SchedulingTermsFilter } from "./components/scheduling-terms-filter"
import { SchedulingTermsTable } from "./components/scheduling-terms-table"
import { SchedulingTermsList } from "./components/scheduling-terms-list"

export default function SchedulingPage() {
  const { activeInstituteId } = useActiveInstitute()

  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState("ALL")

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const filteredTerms = React.useMemo(() => {
    let result = termsQuery.data ?? []
    if (status && status !== "ALL") {
      result = result.filter((term) => term.schedulingStatus === status)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((term) => term.title.toLowerCase().includes(q))
    }
    return result
  }, [termsQuery.data, status, search])

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          filter={
            <SchedulingTermsFilter
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />
          }
        >
          <div className="hidden lg:block">
            <SchedulingTermsTable
              terms={filteredTerms}
              isLoading={termsQuery.isLoading}
            />
          </div>
          <div className="block lg:hidden">
            <SchedulingTermsList
              terms={filteredTerms}
              isLoading={termsQuery.isLoading}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
