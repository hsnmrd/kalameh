"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Check } from "lucide-react"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { DataTable } from "@workspace/ui/components/data-table"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface DemandTableProps {
  items: CourseDemandSummaryDto[]
  isLoading: boolean
}

export function DemandTable({ items, isLoading }: DemandTableProps) {
  const t = useTranslations("scheduling")
  const tDemand = useTranslations("scheduling.demand")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<CourseDemandSummaryDto>[]>(
    () => [
      {
        accessorKey: "courseTitle",
        header: tDemand("columns.course"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.courseTitle}
            </span>
            {row.original.prerequisiteTitle ? (
              <span className="text-xs text-muted-foreground">
                پیشنیاز: {row.original.prerequisiteTitle}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "eligibleStudentsCount",
        header: tDemand("columns.totalStudents"),
        cell: ({ row }) => {
          const count = row.original.eligibleStudentsCount
          if (count === 0) {
            return (
              <span className="text-sm text-muted-foreground">
                {formatNumber(0, locale)}
              </span>
            )
          }

          const { passedPrerequisiteCount, newPlacementCount } = row.original
          return (
            <div className="flex flex-col">
              <span className="font-bold text-foreground">
                {t("planDetails.people", {
                  count: formatNumber(count, locale),
                })}
              </span>
              {(passedPrerequisiteCount > 0 || newPlacementCount > 0) && (
                <span className="text-xs text-muted-foreground">
                  {passedPrerequisiteCount > 0 &&
                    `${tDemand("columns.passed")}: ${formatNumber(passedPrerequisiteCount, locale)}`}
                  {passedPrerequisiteCount > 0 &&
                    newPlacementCount > 0 &&
                    " · "}
                  {newPlacementCount > 0 &&
                    `${tDemand("columns.placement")}: ${formatNumber(newPlacementCount, locale)}`}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "suggestedClassCount",
        header: tDemand("columns.suggestedClasses"),
        cell: ({ row }) => {
          const count = row.original.suggestedClassCount
          if (count === 0) {
            return (
              <span className="text-sm text-muted-foreground">
                {formatNumber(0, locale)}
              </span>
            )
          }

          return (
            <Badge variant="secondary" className="font-bold">
              {t("planDetails.proposalCount", {
                count: formatNumber(count, locale),
              })}
            </Badge>
          )
        },
      },
      {
        id: "requirementStatus",
        header: tDemand("columns.requirementStatus"),
        cell: ({ row }) => {
          const {
            existingRequirementId,
            currentRequirementClassCount,
            suggestedClassCount,
          } = row.original

          if (existingRequirementId) {
            const isChanged =
              currentRequirementClassCount !== suggestedClassCount
            return (
              <div className="flex flex-col items-start gap-1">
                <Badge variant="success" className="gap-1">
                  <Check className="size-3 text-success-foreground" />
                  <span>
                    {tDemand("columns.registeredCount", {
                      count: formatNumber(
                        currentRequirementClassCount ?? 0,
                        locale
                      ),
                    })}
                  </span>
                </Badge>
                {isChanged && (
                  <span className="text-[11px] text-muted-foreground">
                    {tDemand("columns.reviewNeeded", {
                      count: formatNumber(suggestedClassCount, locale),
                    })}
                  </span>
                )}
              </div>
            )
          }

          return (
            <Badge variant="outline" className="text-muted-foreground">
              {tDemand("columns.notRegistered")}
            </Badge>
          )
        },
      },
    ],
    [t, tDemand, locale]
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
      emptyMessage={tDemand("emptyDemand")}
    />
  )
}
