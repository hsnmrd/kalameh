"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Layers, Edit2, GraduationCap } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable } from "@workspace/ui/components/data-table"
import { Price } from "@workspace/ui/components/price"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type ClassDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface ClassesTableProps {
  classes: ClassDto[] | undefined
  isLoading: boolean
  onEdit: (cls: ClassDto) => void
}

export function ClassesTable({
  classes,
  isLoading,
  onEdit,
}: ClassesTableProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<ClassDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("table.title"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Layers className="size-4" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-foreground">
                {row.original.title}
              </span>
              {row.original.schedule && (
                <span className="block text-xs text-muted-foreground">
                  {row.original.schedule}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "course",
        header: t("table.course"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground/90">
            {row.original.course?.title || "-"}
          </span>
        ),
      },
      {
        accessorKey: "term",
        header: t("table.term"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {row.original.term?.title || "-"}
          </span>
        ),
      },
      {
        accessorKey: "branch",
        header: t("table.branch"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {row.original.branch?.name || (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "teacherName",
        header: t("table.instructor"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {row.original.teacherName || "-"}
          </span>
        ),
      },
      {
        accessorKey: "capacity",
        header: t("table.capacity"),
        cell: ({ row }) => {
          const enrolled = row.original.enrolledCount ?? 0
          const cap = row.original.capacity
          const isFull = enrolled >= cap

          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isFull
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                <span className="font-sans">
                  {formatNumber(enrolled, locale)} / {formatNumber(cap, locale)}
                </span>
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "fee",
        header: t("table.fee"),
        cell: ({ row }) => (
          <Price
            amount={row.original.fee}
            locale={locale}
            className="text-sm text-foreground"
          />
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <PermissionGuard
              permission={[PERMISSIONS.VIEW_GRADES, PERMISSIONS.MANAGE_GRADES]}
              mode="disable"
            >
              <Link href={`/classes/${row.original.id}/grades`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-primary hover:bg-muted"
                >
                  <GraduationCap className="size-3.5" />
                  <span>{t("grades")}</span>
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSES}
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

  if (!classes || classes.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Layers className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={classes} />
}
