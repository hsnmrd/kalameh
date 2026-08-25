"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Building2, Edit2, MapPin, Phone } from "lucide-react"
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
import { PERMISSIONS, type BranchWithStats } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { BranchStatusBadge } from "../branch-status-badge"

export interface BranchesTableProps {
  branches: BranchWithStats[] | undefined
  isLoading: boolean
  onEdit: (branch: BranchWithStats) => void
}

export function BranchesTable({
  branches,
  isLoading,
  onEdit,
}: BranchesTableProps) {
  const t = useTranslations("branches")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<BranchWithStats>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Building2 className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: t("table.address"),
        cell: ({ row }) => (
          <div className="flex max-w-[280px] items-center gap-1.5 truncate text-sm text-foreground/80">
            {row.original.address ? (
              <>
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{row.original.address}</span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "phones",
        header: t("table.phones"),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            {row.original.phones && row.original.phones.length > 0 ? (
              row.original.phones.map((phone, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground"
                >
                  <Phone className="size-2.5 text-muted-foreground" />
                  {phone}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "classesCount",
        header: t("table.classesCount"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            {formatNumber(row.original.classesCount ?? 0, locale)}
          </span>
        ),
      },
      {
        accessorKey: "usersCount",
        header: t("table.usersCount"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            {formatNumber(row.original.usersCount ?? 0, locale)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("table.status"),
        cell: ({ row }) => (
          <BranchStatusBadge isActive={row.original.isActive} />
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_BRANCHES}
              mode="disable"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                aria-label={t("table.actions")}
              >
                <Edit2 className="size-4" />
              </Button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [t, locale, onEdit]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!branches || branches.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Building2 className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <DataTable columns={columns} data={branches} />
}
