"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { BookOpenCheck } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTable } from "@workspace/ui/components/data-table"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingRequirementTableProps {
  items: ClassRequirementDto[]
  selectedIds: string[]
  onToggle: (id: string, checked: boolean) => void
  onToggleAll?: (checked: boolean) => void
}

interface RequirementTableMeta {
  items: ClassRequirementDto[]
  selectedIds: string[]
  onToggle: (id: string, checked: boolean) => void
  onToggleAll?: (checked: boolean) => void
}

export function SchedulingRequirementTable({
  items,
  selectedIds,
  onToggle,
  onToggleAll,
}: SchedulingRequirementTableProps) {
  const t = useTranslations("scheduling.generation.requirements")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<ClassRequirementDto>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const meta = table.options.meta as RequirementTableMeta | undefined
          const list = meta?.items ?? []
          const selected = meta?.selectedIds ?? []
          const allSelected =
            list.length > 0 && list.every((item) => selected.includes(item.id))
          const someSelected =
            list.some((item) => selected.includes(item.id)) && !allSelected

          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={(checked) =>
                  meta?.onToggleAll?.(Boolean(checked))
                }
                aria-label={t("columns.select")}
              />
            </div>
          )
        },
        cell: ({ row, table }) => {
          const meta = table.options.meta as RequirementTableMeta | undefined
          const isSelected =
            meta?.selectedIds.includes(row.original.id) ?? false
          const checkboxId = `requirement-${row.original.id}`
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                id={checkboxId}
                checked={isSelected}
                onCheckedChange={(checked) =>
                  meta?.onToggle(row.original.id, Boolean(checked))
                }
                aria-label={row.original.course?.title ?? t("unnamed")}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "course",
        header: t("columns.course"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpenCheck className="size-4" />
            </div>
            <span className="font-semibold text-foreground">
              {row.original.course?.title ?? t("unnamed")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "branch",
        header: t("columns.branch"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.branch?.name ?? t("allBranches")}
          </span>
        ),
      },
      {
        accessorKey: "deliveryMode",
        header: t("columns.deliveryMode"),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.deliveryMode === "ONLINE" ? "secondary" : "outline"
            }
            className="text-xs font-normal"
          >
            {t(`deliveryModes.${row.original.deliveryMode}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "requiredClassCount",
        header: t("columns.requiredClassCount"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {formatNumber(row.original.requiredClassCount, locale)}
          </span>
        ),
      },
      {
        accessorKey: "capacity",
        header: t("columns.capacity"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {formatNumber(row.original.capacity, locale)}
          </span>
        ),
      },
    ],
    [locale, t]
  )

  const meta: RequirementTableMeta = React.useMemo(
    () => ({
      items,
      selectedIds,
      onToggle,
      onToggleAll,
    }),
    [items, onToggle, onToggleAll, selectedIds]
  )

  return (
    <DataTable
      columns={columns}
      data={items}
      meta={meta}
      getRowId={(row) => row.id}
    />
  )
}
