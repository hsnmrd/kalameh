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
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Calendar className="size-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "startDate",
        header: t("table.startDate"),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "endDate",
        header: t("table.endDate"),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {formatDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: "classesCount",
        header: t("table.classesCount"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
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
              className="size-8 p-0 text-slate-600 hover:text-slate-900"
              aria-label={t("table.actions")}
            >
              <Edit2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, locale]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Spinner className="size-8 text-slate-600" />
      </div>
    )
  }

  if (!terms || terms.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Calendar className="size-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">{t("table.empty")}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
      <DataTable columns={columns} data={terms} />
    </div>
  )
}
