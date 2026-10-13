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
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : institutes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("noInstitutes")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              onClick={handleCreate}
              className="cursor-pointer gap-2"
            >
              <span>{t("addInstitute")}</span>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Desktop: Data Table */}
          <div className="hidden lg:block">
            <InstitutesTable
              institutes={institutes}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleCreate}
            />
          </div>

          {/* Mobile: Flat Divider List */}
          <div className="lg:hidden">
            <InstitutesList
              institutes={institutes}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </AdminPageShell>
  )
}
