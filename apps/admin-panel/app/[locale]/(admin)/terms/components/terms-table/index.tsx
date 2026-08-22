"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Calendar, Edit2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import type { TermDto } from "@workspace/types"
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
      return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d)
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
            {row.original.classesCount ?? 0}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label={t("table.actions")}
            >
              <Edit2 className="size-4" />
            </Button>
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
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Calendar className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={terms} />
}
