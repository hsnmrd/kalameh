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
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { transactionsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { TransactionsFilter } from "./components/transactions-filter"
import { TransactionsList } from "./components/transactions-list"
import { TransactionsTable } from "./components/transactions-table"

export default function TransactionsPage() {
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters<{
      search: string
      status: TransactionStatus | "ALL"
      page: number
      pageSize: number
    }>({
      defaultValues: {
        search: "",
        status: "ALL",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["search"],
    })

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.FINANCE)

  const { data: transactions, isLoading } = useQuery({
    ...transactionsResource.list.toQuery({
      instituteId: activeInstituteId,
      search: filters.search.trim() || undefined,
      status: filters.status === "ALL" ? undefined : filters.status,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const isListEmpty = !isLoading && (!transactions || transactions.length === 0)

  const handleReview = (transaction: TransactionDto) =>
    openModal("reviewTransaction", { transaction })

  return (
    <ModuleGuard module={APP_MODULES.FINANCE}>
      <PermissionGuard
        permission={PERMISSIONS.VIEW_TRANSACTIONS}
        mode="forbidden"
      >
        <AdminPageShell
          isEmpty={isListEmpty}
          filters={
            <TransactionsFilter
              isEmpty={isListEmpty}
              search={filters.search}
              onSearchChange={(search) => setFilter("search", search)}
              status={filters.status}
              onStatusChange={(status) => setFilter("status", status)}
            />
          }
          modals={<ModalGateway registry={modalRegistry} />}
        >
          <div className="hidden lg:block">
            <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
              <TransactionsTable
                transactions={transactions}
                isLoading={isLoading}
                onReview={handleReview}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </React.Suspense>
          </div>
          <div className="flex flex-1 flex-col lg:hidden">
            <React.Suspense fallback={<ListSkeleton rows={pageSize} />}>
              <TransactionsList
                transactions={transactions}
                isLoading={isLoading}
                onReview={handleReview}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
              />
            </React.Suspense>
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
