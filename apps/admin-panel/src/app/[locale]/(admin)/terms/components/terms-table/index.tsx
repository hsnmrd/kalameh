"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Calendar, Edit2 } from "lucide-react"
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
import { PERMISSIONS, type TermDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { TermStatusBadge } from "../term-status-badge"

export interface TermsTableProps {
  terms: TermDto[] | undefined
  isLoading: boolean
  onEdit: (term: TermDto) => void
}

export function TermsTable({ terms, isLoading, onEdit }: TermsTableProps) {
  const t = useTranslations("terms")
  const locale = useLocale()

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal)
      return new Intl.DateTimeFormat(
        locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      ).format(d)
    } catch {
      return String(dateVal)
    }
  }

  const columns = React.useMemo<ColumnDef<TermDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("table.title"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Calendar className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "startDate",
        header: t("table.startDate"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "endDate",
        header: t("table.endDate"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {formatDate(row.original.endDate)}
          </span>
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
        accessorKey: "status",
        header: t("table.status"),
        cell: ({ row }) => <TermStatusBadge isActive={row.original.isActive} />,
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_TERMS}
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

  if (!terms || terms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Calendar className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <DataTable columns={columns} data={terms} />
}
