"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import type { TermDemandReportDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  DemandBreakdownDrawer,
  type CourseAdjustment,
} from "./demand-breakdown-drawer"

export interface SchedulingDemandViewProps {
  termId: string
  demandData: TermDemandReportDto | null
  isLoading: boolean
  search?: string
  onCalculateDemand?: () => void
  onGenerateTimetable?: () => void
}

export function SchedulingDemandView({
  termId,
  demandData,
  isLoading,
  search = "",
  onCalculateDemand,
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
    <div className="w-full">
      <DemandBreakdownDrawer
        courses={filteredItems}
        adjustments={adjustments}
        onAdjustmentChange={handleAdjustmentChange}
        isLoading={isLoading}
      />
    </div>
  )
}
