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
import { InstituteCard } from "./components/institute-card"
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
          onAddClick={handleCreate}
        />
      }
      modals={<ModalGateway registry={modalRegistry} />}
      fab={<FABSingle onClick={handleCreate} aria-label={t("addInstitute")} />}
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
              onClick={handleCreate}
              className="cursor-pointer rounded-xl"
            >
              <span>{t("addInstitute")}</span>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Desktop: Card Grid */}
          <div className="hidden gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {institutes.map((institute) => (
              <InstituteCard
                key={institute.id}
                institute={institute}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
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
