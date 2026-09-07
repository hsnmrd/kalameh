"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  APP_MODULES,
  PERMISSIONS,
  ROLES,
  type TransactionDto,
  type TransactionStatus,
} from "@workspace/types"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions } from "@/lib/hooks"
import { transactionsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { ReviewTransactionModal } from "./components/review-transaction-modal"
import { TransactionsFilter } from "./components/transactions-filter"
import { TransactionsList } from "./components/transactions-list"
import { TransactionsTable } from "./components/transactions-table"

export default function TransactionsPage() {
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<TransactionStatus | "ALL">("ALL")
  const [reviewing, setReviewing] = React.useState<TransactionDto | null>(null)
  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.FINANCE)
  const { data: transactions, isLoading } = useQuery({
    ...transactionsResource.list.toQuery({
      instituteId: activeInstituteId,
      search: search.trim() || undefined,
      status: status === "ALL" ? undefined : status,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.FINANCE}>
      <PermissionGuard
        permission={PERMISSIONS.VIEW_TRANSACTIONS}
        mode="forbidden"
      >
        <AdminPageShell
          filters={
            <TransactionsFilter
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
            />
          }
          modals={
            <ReviewTransactionModal
              key={reviewing?.id ?? "closed"}
              transaction={reviewing}
              onClose={() => setReviewing(null)}
            />
          }
        >
          <div className="hidden lg:block">
            <TransactionsTable
              transactions={transactions}
              isLoading={isLoading}
              onReview={setReviewing}
            />
          </div>
          <div className="lg:hidden">
            <TransactionsList
              transactions={transactions}
              isLoading={isLoading}
              onReview={setReviewing}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
