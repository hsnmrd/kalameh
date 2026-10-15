"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Building2 } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { FABSingle } from "@workspace/ui/components/fab"
import type { InstituteWithStats } from "@workspace/types"
import { parseStatusFilter } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { InstitutesTable } from "./components/institutes-table"
import { InstitutesList } from "./components/institutes-list"
import { InstitutesFilter } from "./components/institutes-filter"

export default function InstitutesPage() {
  const t = useTranslations("institutes")
  const { openModal } = useModal()

  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { data: institutes = [], isLoading } = useQuery(
    institutesResource.list.toQuery({
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
    })
  )

  const isListEmpty = !isLoading && institutes.length === 0

  const handleCreate = () => openModal("createInstitute")
  const handleEdit = (institute: InstituteWithStats) =>
    openModal("editInstitute", { institute })
  const handleDelete = (institute: InstituteWithStats) =>
    openModal("deleteInstitute", { institute })

  return (
    <AdminPageShell
      filters={
        <InstitutesFilter
          search={search}
          onSearchChange={setSearch}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onAddClick={isListEmpty ? undefined : handleCreate}
        />
      }
      modals={<ModalGateway registry={modalRegistry} />}
      fab={
        isListEmpty ? null : (
          <FABSingle onClick={handleCreate} aria-label={t("addInstitute")} />
        )
      }
    >
      {/* Desktop: Data Table */}
      <div className="hidden lg:block">
        <React.Suspense fallback={<TableSkeleton rows={5} />}>
          <InstitutesTable
            institutes={institutes}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleCreate}
          />
        </React.Suspense>
      </div>

      {/* Mobile: Flat Divider List */}
      <div className="flex flex-1 flex-col lg:hidden">
        <React.Suspense fallback={<ListSkeleton rows={5} />}>
          <InstitutesList
            institutes={institutes}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </React.Suspense>
      </div>
    </AdminPageShell>
  )
}
