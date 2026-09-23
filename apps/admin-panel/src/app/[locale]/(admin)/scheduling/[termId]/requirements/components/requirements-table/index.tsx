"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Edit2, Trash2 } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import { DataTable } from "@workspace/ui/components/data-table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface RequirementsTableProps {
  items: ClassRequirementDto[]
  isLoading: boolean
  onEdit: (item: ClassRequirementDto) => void
  onDelete: (item: ClassRequirementDto) => void
}

export function RequirementsTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: RequirementsTableProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<ClassRequirementDto>[]>(
    () => [
      {
        accessorKey: "course",
        header: t("requirementsPage.columns.course"),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.course?.title ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "branch",
        header: t("requirementsPage.columns.branch"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.branch?.name ??
              t("requirementsPage.fields.branchPlaceholder")}
          </span>
        ),
      },
      {
        accessorKey: "requiredClassCount",
        header: t("requirementsPage.columns.requiredClassCount"),
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-bold">
            {formatNumber(row.original.requiredClassCount, locale)}{" "}
            {t("planDetails.proposalCount", { count: "" }).trim()}
          </Badge>
        ),
      },
      {
        accessorKey: "capacity",
        header: t("requirementsPage.columns.capacity"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatNumber(row.original.capacity, locale)}{" "}
            {t("planDetails.people", { count: "" }).trim()}
          </span>
        ),
      },
      {
        accessorKey: "deliveryMode",
        header: t("requirementsPage.columns.deliveryMode"),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.deliveryMode === "ONLINE" ? "outline" : "secondary"
            }
          >
            {t(`demand.deliveryModes.${row.original.deliveryMode}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "sessionsPerWeek",
        header: t("requirementsPage.columns.sessionsPerWeek"),
        cell: ({ row }) => {
          const sessions = row.original.sessionsPerWeek
          if (!sessions) return <span className="text-muted-foreground">-</span>
          return (
            <Badge variant="outline">
              {sessions === 3
                ? t("requirementsPage.fields.cadence3")
                : sessions === 2
                  ? t("requirementsPage.fields.cadence2")
                  : t("requirementsPage.fields.cadence1")}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: t("requirementsPage.columns.actions"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(row.original)}
              aria-label={t("requirementsPage.editRequirement")}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(row.original)}
              aria-label={t("requirementsPage.deleteRequirement")}
              className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, locale, onEdit, onDelete]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      emptyMessage={t("requirementsPage.empty")}
    />
  )
}
