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
import { DemandStats } from "./demand-stats"
import { DemandTable } from "./demand-table"
import { DemandList } from "./demand-list"

export interface SchedulingDemandViewProps {
  termId: string
  demandData: TermDemandReportDto | null
  isLoading: boolean
  search: string
  termOptions?: { value: string; label: string }[]
  onTermChange?: (termId: string) => void
  onCalculateDemand?: () => void
}

export function SchedulingDemandView({
  termId,
  demandData,
  isLoading,
  search,
  termOptions = [],
  onTermChange,
  onCalculateDemand,
}: SchedulingDemandViewProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "REGISTERED" | "UNREGISTERED"
  >("ALL")

  const courses = demandData?.courses ?? []

  const registeredCount = React.useMemo(
    () => courses.filter((c) => c.existingRequirementId !== null).length,
    [courses]
  )
  const unregisteredCount = React.useMemo(
    () => courses.filter((c) => c.existingRequirementId === null).length,
    [courses]
  )
  const totalRegisteredClasses = React.useMemo(
    () =>
      courses.reduce(
        (sum, item) => sum + (item.currentRequirementClassCount ?? 0),
        0
      ),
    [courses]
  )

  const filteredItems = React.useMemo(() => {
    let list = courses
    if (statusFilter === "REGISTERED") {
      list = list.filter((c) => c.existingRequirementId !== null)
    } else if (statusFilter === "UNREGISTERED") {
      list = list.filter((c) => c.existingRequirementId === null)
    }
    if (!search.trim()) return list
    const query = search.trim().toLowerCase()
    return list.filter(
      (item) =>
        item.courseTitle.toLowerCase().includes(query) ||
        (item.prerequisiteTitle &&
          item.prerequisiteTitle.toLowerCase().includes(query))
    )
  }, [courses, statusFilter, search])

  const totalPassed = React.useMemo(
    () => courses.reduce((sum, item) => sum + item.passedPrerequisiteCount, 0),
    [courses]
  )
  const totalPlacement = React.useMemo(
    () => courses.reduce((sum, item) => sum + item.newPlacementCount, 0),
    [courses]
  )
  const totalSuggestedClasses = React.useMemo(
    () => courses.reduce((sum, item) => sum + item.suggestedClassCount, 0),
    [courses]
  )

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
              className="h-14 gap-2 rounded-2xl px-6 text-base font-semibold"
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
    <div className="flex flex-col gap-6">
      <DemandStats
        totalStudents={demandData.totalEligibleStudents}
        passedStudents={totalPassed}
        placementStudents={totalPlacement}
        suggestedClasses={totalSuggestedClasses}
        registeredClasses={totalRegisteredClasses}
      />

      {/* Course Demand & Registration Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
          <Button
            type="button"
            variant={statusFilter === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            {t("demand.filters.statusAll", {
              count: formatNumber(courses.length, locale),
            })}
          </Button>
          <Button
            type="button"
            variant={statusFilter === "REGISTERED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("REGISTERED")}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            <Check className="size-3.5" />
            {t("demand.filters.statusRegistered", {
              count: formatNumber(registeredCount, locale),
            })}
          </Button>
          <Button
            type="button"
            variant={statusFilter === "UNREGISTERED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("UNREGISTERED")}
            className="h-9 rounded-xl px-3 text-xs font-semibold"
          >
            {t("demand.filters.statusUnregistered", {
              count: formatNumber(unregisteredCount, locale),
            })}
          </Button>
        </div>

        {registeredCount > 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-success" />
            <span className="font-medium text-foreground">
              {t("demand.filters.registeredSummary", {
                courses: formatNumber(registeredCount, locale),
                classes: formatNumber(totalRegisteredClasses, locale),
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-muted-foreground/40" />
            <span>{t("demand.filters.noRequestsForTerm")}</span>
          </div>
        )}
      </div>

      {/* Desktop: DataTable */}
      <div className="hidden lg:block">
        <DemandTable items={filteredItems} isLoading={isLoading} />
      </div>

      {/* Mobile: MobileList */}
      <div className="lg:hidden">
        <DemandList items={filteredItems} isLoading={isLoading} />
      </div>
    </div>
  )
}
