"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { CalendarOff, Trash2 } from "lucide-react"
import type { InstituteCustomOffDay } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { formatDisplayDate } from "../../helper"

export interface CustomOffDaysTableProps {
  customOffDays: InstituteCustomOffDay[] | undefined
  isLoading: boolean
  onDelete: (offDay: InstituteCustomOffDay) => void
}

export function CustomOffDaysTable({
  customOffDays,
  isLoading,
  onDelete,
}: CustomOffDaysTableProps) {
  const t = useTranslations("setting.offDays")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<InstituteCustomOffDay>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("offDayTitle"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <CalendarOff className="size-4" />
            </div>
            <span className="font-semibold text-foreground">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: t("date"),
        cell: ({ row }) => (
          <span className="font-sans text-sm text-foreground/80">
            {formatDisplayDate(row.original.date, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original)}
              className="size-8 cursor-pointer p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("deleteOffDayLabel", { title: row.original.title })}
              title={t("deleteTitle")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, locale, onDelete]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!customOffDays || customOffDays.length === 0) {
    return (
      <Empty
        variant="compact"
        className="min-h-[240px] rounded-2xl border border-dashed border-border"
      >
        <EmptyHeader>
          <EmptyMedia variant="default" className="size-12 rounded-2xl">
            <CalendarOff className="size-6" />
          </EmptyMedia>
          <EmptyDescription>{t("noCustomOffDays")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <DataTable columns={columns} data={customOffDays} />
}
