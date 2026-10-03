"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, DoorOpen, Sparkles, Users } from "lucide-react"
import type { SuggestedClassDto, TermDemandReportDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { DemandBreakdownDrawer } from "./demand-breakdown-drawer"

export interface SchedulingDemandViewProps {
  termId: string
  demandData: TermDemandReportDto | null
  isLoading: boolean
  search?: string
  suggestions?: Record<string, SuggestedClassDto[]>
  totalUncoveredStudents?: number
  onCapacityChange?: (
    courseId: string,
    classKey: string,
    capacity: number
  ) => void
  onAddClass?: (courseId: string) => void
  onRemoveClass?: (courseId: string, classKey: string) => void
  onCalculateDemand?: () => void
}

export function SchedulingDemandView({
  demandData,
  isLoading,
  search = "",
  suggestions = {},
  totalUncoveredStudents = 0,
  onCapacityChange = () => undefined,
  onAddClass = () => undefined,
  onRemoveClass = () => undefined,
  onCalculateDemand,
}: SchedulingDemandViewProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const courses = React.useMemo(
    () => demandData?.courses ?? [],
    [demandData?.courses]
  )
  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return courses
    const query = search.trim().toLowerCase()
    return courses.filter(
      (item) =>
        item.courseTitle.toLowerCase().includes(query) ||
        item.prerequisiteTitle?.toLowerCase().includes(query)
    )
  }, [courses, search])

  if (isLoading && !demandData) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!demandData) {
    return (
      <Empty variant="default" className="border border-border bg-card">
        <EmptyMedia variant="icon">
          <Sparkles className="size-7" aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("demand.emptyDemand")}</EmptyTitle>
          <EmptyDescription>{t("demand.emptyDemandDesc")}</EmptyDescription>
        </EmptyHeader>
        {onCalculateDemand && (
          <div className="mt-4">
            <Button type="button" onClick={onCalculateDemand}>
              <Sparkles className="size-5" aria-hidden />
              {t("demand.calculateButton")}
            </Button>
          </div>
        )}
      </Empty>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            {t("demand.summary.eligible", {
              count: formatNumber(demandData.totalEligibleStudents, locale),
            })}
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <DoorOpen className="size-4 text-muted-foreground" aria-hidden />
            {t("demand.summary.effectiveLimit", {
              count: formatNumber(demandData.effectiveCapacityLimit, locale),
            })}
          </Badge>
          {totalUncoveredStudents > 0 && (
            <Badge variant="destructive" className="gap-2 px-3 py-1.5">
              <AlertTriangle
                className="size-4 text-destructive-foreground"
                aria-hidden
              />
              {t("demand.summary.uncovered", {
                count: formatNumber(totalUncoveredStudents, locale),
              })}
            </Badge>
          )}
        </div>
        {demandData.warnings.map((warning) => (
          <p key={warning} className="text-sm text-muted-foreground">
            {t(`demand.warnings.${warning}`)}
          </p>
        ))}
      </div>

      <DemandBreakdownDrawer
        courses={filteredItems}
        suggestions={suggestions}
        capacityLimit={demandData.effectiveCapacityLimit}
        onCapacityChange={onCapacityChange}
        onAddClass={onAddClass}
        onRemoveClass={onRemoveClass}
      />
    </div>
  )
}
