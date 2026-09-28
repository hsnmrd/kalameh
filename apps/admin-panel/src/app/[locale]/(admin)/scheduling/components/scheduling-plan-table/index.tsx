"use client"

import { useLocale, useTranslations } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Check,
  CircleAlert,
  Eye,
  MousePointerClick,
  TriangleAlert,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

interface SchedulingPlanTableProps {
  plans: SchedulingPlanDetailsDto[]
  isSelectionPending: boolean
  selectingPlanId?: string
  onSelect: (planId: string) => void
  onViewDetails: (planId: string) => void
}

const percent = (value: number | null | undefined, locale: string) =>
  value == null
    ? "—"
    : new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(value / 100)

export function SchedulingPlanTable({
  plans,
  isSelectionPending,
  selectingPlanId,
  onSelect,
  onViewDetails,
}: SchedulingPlanTableProps) {
  const t = useTranslations("scheduling.comparison")
  const locale = useLocale()

  const columns: ColumnDef<SchedulingPlanDetailsDto>[] = [
    {
      id: "plan",
      header: t("table.plan"),
      cell: ({ row }) => {
        const currentPlan = row.original

        return (
          <div className="flex min-w-40 flex-col gap-2">
            <div>
              <span className="block text-sm font-bold text-foreground">
                {t("plan", { rank: formatNumber(currentPlan.rank, locale) })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("rank", { rank: formatNumber(currentPlan.rank, locale) })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentPlan.status === "SELECTED" && (
                <Badge>
                  <Check
                    aria-hidden
                    data-icon="inline-start"
                    className="size-3.5"
                  />
                  {t("selection.badge")}
                </Badge>
              )}
              {currentPlan.status === "PUBLISHED" && (
                <Badge variant="success">
                  <Check
                    aria-hidden
                    data-icon="inline-start"
                    className="size-3.5"
                  />
                  {t("statuses.published")}
                </Badge>
              )}
              {currentPlan.status === "REJECTED" && (
                <Badge variant="secondary">{t("statuses.rejected")}</Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "qualityIndex",
      header: t("qualityIndex"),
      cell: ({ row }) => (
        <div className="min-w-28">
          <span className="block text-base font-bold text-foreground tabular-nums">
            {percent(row.original.qualityIndex, locale)}
          </span>
          <span className="text-xs leading-5 text-muted-foreground">
            {t("weightedPoints", {
              earned: formatNumber(row.original.earnedWeightedPoints, locale),
              applicable: formatNumber(
                row.original.applicableWeightedPoints,
                locale
              ),
            })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "coveragePercent",
      header: t("metrics.coverage"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground tabular-nums">
          {percent(row.original.coveragePercent, locale)}
        </span>
      ),
    },
    {
      accessorKey: "minimumCourseCoveragePercent",
      header: t("metrics.minimumCoverage"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground tabular-nums">
          {percent(row.original.minimumCourseCoveragePercent, locale)}
        </span>
      ),
    },
    {
      id: "timeDiversity",
      header: t("metrics.timeDiversity"),
      cell: ({ row }) => {
        const timeDiversity = row.original.scoreBreakdown.criteria.find(
          (criterion) => criterion.code === "SC_TIME_PATTERN_DIVERSITY"
        )

        return (
          <span className="font-semibold text-foreground tabular-nums">
            {percent(
              timeDiversity?.normalizedScore == null
                ? null
                : timeDiversity.normalizedScore * 100,
              locale
            )}
          </span>
        )
      },
    },
    {
      id: "proposals",
      header: t("metrics.proposals"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground tabular-nums">
          {formatNumber(row.original.proposals.length, locale)}
        </span>
      ),
    },
    {
      id: "issues",
      header: t("table.issues"),
      cell: ({ row }) => {
        const missingClassCount = row.original.unresolvedRequirements.reduce(
          (sum, requirement) => sum + requirement.missingClassCount,
          0
        )
        const warningCount =
          row.original.warnings.length +
          row.original.proposals.reduce(
            (sum, proposal) => sum + proposal.warnings.length,
            0
          )

        return (
          <div className="flex min-w-36 flex-col items-start gap-1.5">
            <Badge variant={missingClassCount > 0 ? "warning" : "outline"}>
              <CircleAlert
                aria-hidden
                data-icon="inline-start"
                className="size-3.5"
              />
              {t("missingClasses", {
                count: formatNumber(missingClassCount, locale),
              })}
            </Badge>
            <Badge variant={warningCount > 0 ? "secondary" : "outline"}>
              <TriangleAlert
                aria-hidden
                data-icon="inline-start"
                className="size-3.5"
              />
              {t("warnings", {
                count: formatNumber(warningCount, locale),
              })}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: t("table.actions"),
      cell: ({ row }) => {
        const currentPlan = row.original
        const isSelected = currentPlan.status === "SELECTED"
        const isSelecting = selectingPlanId === currentPlan.id

        return (
          <div className="flex min-w-32 items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onViewDetails(currentPlan.id)}
              aria-label={t("viewDetails")}
              title={t("viewDetails")}
            >
              <Eye aria-hidden />
            </Button>
            {["DRAFT", "SELECTED"].includes(currentPlan.status) && (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="hide"
              >
                <Button
                  type="button"
                  variant={isSelected ? "secondary" : "outline"}
                  size="sm"
                  disabled={isSelectionPending || isSelected}
                  onClick={() => onSelect(currentPlan.id)}
                >
                  {isSelecting ? (
                    <Spinner data-icon="inline-start" size="sm" />
                  ) : isSelected ? (
                    <Check aria-hidden data-icon="inline-start" />
                  ) : (
                    <MousePointerClick aria-hidden data-icon="inline-start" />
                  )}
                  {isSelecting
                    ? t("selection.selecting")
                    : isSelected
                      ? t("selection.selected")
                      : t("selection.select")}
                </Button>
              </PermissionGuard>
            )}
          </div>
        )
      },
    },
  ]

  return <DataTable columns={columns} data={plans} />
}
