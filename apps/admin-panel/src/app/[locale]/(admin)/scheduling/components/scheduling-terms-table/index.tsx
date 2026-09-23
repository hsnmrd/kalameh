"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import type { SchedulingTermSummaryDto } from "@workspace/types"
import { DataTable } from "@workspace/ui/components/data-table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingTermsTableProps {
  terms: SchedulingTermSummaryDto[]
  isLoading: boolean
}

export function SchedulingTermsTable({
  terms,
  isLoading,
}: SchedulingTermsTableProps) {
  const t = useTranslations("scheduling.termsList")
  const locale = useLocale()
  const isRtl = locale === "fa"

  const formatDate = React.useCallback(
    (dateVal: string | Date) => {
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
    },
    [locale]
  )

  const columns = React.useMemo<ColumnDef<SchedulingTermSummaryDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("columns.term"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Calendar className="size-4" />
            </div>
            <div className="flex flex-col">
              <Link
                href={`/${locale}/scheduling/${row.original.id}`}
                className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {row.original.title}
              </Link>
              <span className="text-xs text-muted-foreground">
                {row.original.operatingPhase?.title ?? t("noPhase")}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "dateRange",
        header: t("columns.dateRange"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.startDate)} —{" "}
            {formatDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: "requirementsCount",
        header: t("columns.requirements"),
        cell: ({ row }) => {
          const { requirementsCount, totalRequiredClasses } = row.original
          if (requirementsCount > 0) {
            return (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span>
                  {t("requirementsBadge", {
                    count: formatNumber(requirementsCount, locale),
                    classes: formatNumber(totalRequiredClasses, locale),
                  })}
                </span>
              </Badge>
            )
          }
          return (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t("noRequirements")}
            </Badge>
          )
        },
      },
      {
        accessorKey: "schedulingStatus",
        header: t("columns.status"),
        cell: ({ row }) => {
          const status = row.original.schedulingStatus
          switch (status) {
            case "PUBLISHED":
              return (
                <Badge
                  variant="secondary"
                  className="border-success/30 bg-success/10 text-success"
                >
                  {t("statuses.PUBLISHED")}
                </Badge>
              )
            case "SCHEDULED":
              return <Badge variant="default">{t("statuses.SCHEDULED")}</Badge>
            case "GENERATING":
              return (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/40 text-primary"
                >
                  <Spinner className="size-3" />
                  <span>{t("statuses.GENERATING")}</span>
                </Badge>
              )
            case "READY_TO_SCHEDULE":
              return (
                <Badge
                  variant="outline"
                  className="border-warning/40 text-warning"
                >
                  {t("statuses.READY_TO_SCHEDULE")}
                </Badge>
              )
            case "NO_REQUIREMENTS":
            default:
              return (
                <Badge variant="outline" className="text-muted-foreground">
                  {t("statuses.NO_REQUIREMENTS")}
                </Badge>
              )
          }
        },
      },
      {
        id: "actions",
        header: t("columns.actions"),
        cell: ({ row }) => {
          const ChevronIcon = isRtl ? ChevronLeft : ChevronRight
          return (
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    href={`/${locale}/scheduling/${row.original.id}`}
                    className="gap-1.5 text-xs font-medium"
                  />
                }
              >
                <span>{t("actions.manageTerm")}</span>
                <ChevronIcon className="size-3.5" />
              </Button>
            </div>
          )
        },
      },
    ],
    [t, locale, isRtl, formatDate]
  )

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <DataTable
        columns={columns}
        data={terms}
        emptyMessage={t("empty.title")}
      />
    </div>
  )
}
