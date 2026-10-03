"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { DoorOpen, Edit2, Trash2, Building2, Users } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type ClassroomDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { ClassroomStatusBadge } from "../classroom-status-badge"

export interface ClassroomsTableProps {
  classrooms: ClassroomDto[] | undefined
  isLoading: boolean
  onEdit: (classroom: ClassroomDto) => void
  onDelete: (classroom: ClassroomDto) => void
}

export function ClassroomsTable({
  classrooms,
  isLoading,
  onEdit,
  onDelete,
}: ClassroomsTableProps) {
  const t = useTranslations("classrooms")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<ClassroomDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <DoorOpen className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "branch",
        header: t("table.branch"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {row.original.branch?.name || t("createModal.noBranch")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "capacity",
        header: t("table.capacity"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Users className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              {formatNumber(row.original.capacity, locale)} {t("person")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: t("table.description"),
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-xs text-muted-foreground">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: t("table.status"),
        cell: ({ row }) => (
          <ClassroomStatusBadge isActive={row.original.isActive} />
        ),
      },
      {
        accessorKey: "classesCount",
        header: t("table.classesCount"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-muted-foreground">
            {formatNumber(row.original.classesCount ?? 0, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSROOMS}
              mode="hide"
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onEdit(row.original)}
                aria-label={t("editModal.title")}
              >
                <Edit2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(row.original)}
                aria-label={t("table.actions")}
              >
                <Trash2 className="size-4" />
              </Button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [t, locale, onEdit, onDelete]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DoorOpen className="size-8 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{t("table.empty")}</EmptyTitle>
            <EmptyDescription>{t("subtitle")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <DataTable columns={columns} data={classrooms} />
    </div>
  )
}
