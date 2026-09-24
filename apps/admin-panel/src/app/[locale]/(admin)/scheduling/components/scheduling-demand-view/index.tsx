"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, Check, Sparkles } from "lucide-react"
import type { TermDemandReportDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { SmartDemandHero } from "./smart-demand-hero"
import {
  DemandBreakdownDrawer,
  type CourseAdjustment,
} from "./demand-breakdown-drawer"

export interface SchedulingDemandViewProps {
  termId: string
  demandData: TermDemandReportDto | null
  isLoading: boolean
  search?: string
  termOptions?: { value: string; label: string }[]
  onTermChange?: (termId: string) => void
  onCalculateDemand?: () => void
  onGenerateTimetable?: () => void
}

export function SchedulingDemandView({
  termId,
  demandData,
  isLoading,
  search = "",
  termOptions = [],
  onTermChange,
  onCalculateDemand,
  onGenerateTimetable,
}: SchedulingDemandViewProps) {
  const t = useTranslations("scheduling")

  const [adjustments, setAdjustments] = React.useState<
    Record<string, CourseAdjustment>
  >({})

  const handleAdjustmentChange = React.useCallback(
    (courseId: string, changes: CourseAdjustment) => {
      setAdjustments((prev) => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          ...changes,
        },
      }))
    },
    []
  )

  const courses = demandData?.courses ?? []

  const totalSuggestedClasses = React.useMemo(() => {
    return courses.reduce((sum, item) => {
      const adj = adjustments[item.courseId]
      return sum + (adj?.suggestedClassCount ?? item.suggestedClassCount)
    }, 0)
  }, [courses, adjustments])

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return courses
    const query = search.trim().toLowerCase()
    return courses.filter(
      (item) =>
        item.courseTitle.toLowerCase().includes(query) ||
        (item.prerequisiteTitle &&
          item.prerequisiteTitle.toLowerCase().includes(query))
    )
  }, [courses, search])

  if (!termId) {
    return (
      <Empty variant="default" className="border border-border bg-card">
        <EmptyMedia variant="icon">
          <CalendarClock className="size-7" aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("demand.selectTermPrompt")}</EmptyTitle>
          <EmptyDescription>
            {t("demand.selectTermPromptDesc")}
          </EmptyDescription>
        </EmptyHeader>
        {termOptions.length > 0 && onTermChange && (
          <div className="mt-4 flex w-full max-w-xs flex-col items-center gap-2">
            <ResponsiveCombobox
              items={termOptions}
              value={termId}
              onValueChange={(val?: string) => onTermChange(val ?? "")}
              placeholder={t("demand.filters.term")}
              drawerTitle={t("demand.filters.term")}
              clearable={false}
            />
          </div>
        )}
      </Empty>
    )
  }

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
          <EmptyTitle>{t("demand.tabTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("demand.selectTermPromptDesc")}
          </EmptyDescription>
        </EmptyHeader>
        {onCalculateDemand && (
          <div className="mt-4">
            <Button
              type="button"
              onClick={onCalculateDemand}
              className="gap-2 px-6 font-semibold"
            >
              <Sparkles className="size-5" />
              <span>{t("demand.calculateButton")}</span>
            </Button>
          </div>
        )}
      </Empty>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <SmartDemandHero
        totalSuggestedClasses={totalSuggestedClasses}
        totalContinuingStudents={demandData.totalContinuingStudents}
        totalNewPlacements={demandData.totalNewPlacements}
        totalEligibleStudents={demandData.totalEligibleStudents}
        isLoading={isLoading}
        onGenerateTimetable={onGenerateTimetable}
      />

      <DemandBreakdownDrawer
        courses={filteredItems}
        adjustments={adjustments}
        onAdjustmentChange={handleAdjustmentChange}
        isLoading={isLoading}
      />
    </div>
  )
}
