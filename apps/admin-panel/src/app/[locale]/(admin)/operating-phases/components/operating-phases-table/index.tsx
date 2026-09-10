"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Clock, Edit2, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import {
  PERMISSIONS,
  JALALI_MONTHS,
  isOperatingPhaseCurrent,
  getCurrentJalaliMonth,
  type OperatingPhaseWithSlots,
} from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface OperatingPhasesTableProps {
  phases: OperatingPhaseWithSlots[] | undefined
  isLoading: boolean
  onEdit: (phase: OperatingPhaseWithSlots) => void
  onDelete: (phase: OperatingPhaseWithSlots) => void
}

export function OperatingPhasesTable({
  phases,
  isLoading,
  onEdit,
  onDelete,
}: OperatingPhasesTableProps) {
  const t = useTranslations("operating-phases")

  const currentJalaliMonth = React.useMemo(() => getCurrentJalaliMonth(), [])
  const currentMonthName = React.useMemo(() => {
    return JALALI_MONTHS.find((m) => m.id === currentJalaliMonth)?.nameFa
  }, [currentJalaliMonth])

  const getMonthNames = (monthIds: number[]) => {
    return monthIds
      .map((id) => JALALI_MONTHS.find((m) => m.id === id)?.nameFa)
      .filter(Boolean)
      .join("، ")
  }

  const columns = React.useMemo<ColumnDef<OperatingPhaseWithSlots>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("table.title"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Clock className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {row.original.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.original.daysOfWeek.length} روز کاری
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "months",
        header: t("table.months"),
        cell: ({ row }) => {
          const names = getMonthNames(row.original.months)
          return (
            <div className="flex max-w-[280px] flex-col gap-1">
              <span
                className="truncate text-xs text-foreground/90"
                title={names}
              >
                {names}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {row.original.months.length} ماه
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "hours",
        header: t("table.hours"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-foreground">
              <span>{row.original.startTime}</span>
              <span className="text-muted-foreground">تا</span>
              <span>{row.original.endTime}</span>
            </div>
            {row.original.hasBreak &&
              row.original.breakStartTime &&
              row.original.breakEndTime && (
                <span className="text-[11px] text-muted-foreground">
                  {t("table.breakHint", {
                    start: row.original.breakStartTime,
                    end: row.original.breakEndTime,
                  })}
                </span>
              )}
          </div>
        ),
      },
      {
        accessorKey: "slotDurationMinutes",
        header: t("table.duration"),
        cell: ({ row }) => (
          <span className="text-xs text-foreground/80">
            {row.original.slotDurationMinutes} دقیقه
          </span>
        ),
      },
      {
        accessorKey: "slots",
        header: t("table.slots"),
        cell: ({ row }) => {
          const calc = row.original.calculation
          return (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {calc.fullSlotsCount} زنگ
              </Badge>
              {calc.hasWarning && (
                <Badge
                  variant="warning"
                  className="flex items-center gap-1 text-[11px]"
                  title={calc.warningMessageFa}
                >
                  <AlertTriangle className="size-3 text-warning" />
                  <span>+{calc.remainderMinutes}د مازاد</span>
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "currentStatus",
        header: t("table.currentStatus"),
        cell: ({ row }) => {
          const isCurrent = isOperatingPhaseCurrent(
            row.original,
            currentJalaliMonth
          )
          if (isCurrent) {
            return (
              <Badge
                variant="success"
                className="gap-1.5 text-xs font-semibold"
                title={`${t("table.currentPhase")} (${currentMonthName || ""})`}
              >
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                <span>{t("table.runningNow")}</span>
              </Badge>
            )
          }
          return (
            <span className="text-xs text-muted-foreground">
              {t("table.notRunning")}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <PermissionGuard permission={PERMISSIONS.MANAGE_OPERATING_PHASES}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
                className="size-8 p-0"
                title={t("editPhase")}
              >
                <Edit2 className="size-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row.original)}
                className="size-8 p-0 text-destructive hover:text-destructive"
                title={t("deletePhase")}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </PermissionGuard>
          </div>
        ),
      },
    ],
    [t, onEdit, onDelete, currentJalaliMonth, currentMonthName]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!phases || phases.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Clock className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("noPhases")}</EmptyTitle>
          <EmptyDescription>{t("noPhasesDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <DataTable columns={columns} data={phases} />
}
