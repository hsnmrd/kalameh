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
import { AdminPageShell } from "@/components/admin-page-shell"
import { InstituteCard } from "./components/institute-card"
import { InstitutesList } from "./components/institutes-list"
import { InstitutesFilter } from "./components/institutes-filter"
import { CreateInstituteModal } from "./components/create-institute-modal"
import { EditInstituteModal } from "./components/edit-institute-modal"
import { DeleteInstituteModal } from "./components/delete-institute-modal"

export default function InstitutesPage() {
  const t = useTranslations("institutes")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingInstitute, setEditingInstitute] =
    React.useState<InstituteWithStats | null>(null)
  const [deletingInstitute, setDeletingInstitute] =
    React.useState<InstituteWithStats | null>(null)
  const [search, setSearch] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { data: institutes = [], isLoading } = useQuery(
    institutesResource.list.toQuery({
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
    })
  )

  return (
    <AdminPageShell
      filters={
        <InstitutesFilter
          search={search}
          onSearchChange={setSearch}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      }
      fab={
        <FABSingle
          onClick={() => setIsCreateOpen(true)}
          aria-label={t("addInstitute")}
        />
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
              onClick={() => setIsCreateOpen(true)}
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
                onEdit={(inst) => setEditingInstitute(inst)}
                onDelete={(inst) => setDeletingInstitute(inst)}
              />
            ))}
          </div>

          {/* Mobile: Flat Divider List */}
          <div className="lg:hidden">
            <InstitutesList
              institutes={institutes}
              isLoading={isLoading}
              onEdit={(inst) => setEditingInstitute(inst)}
              onDelete={(inst) => setDeletingInstitute(inst)}
            />
          </div>
        </>
      )}

      <CreateInstituteModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditInstituteModal
        open={Boolean(editingInstitute)}
        institute={editingInstitute}
        onClose={() => setEditingInstitute(null)}
      />

      <DeleteInstituteModal
        open={Boolean(deletingInstitute)}
        institute={deletingInstitute}
        onClose={() => setDeletingInstitute(null)}
      />
    </AdminPageShell>
  )
}
