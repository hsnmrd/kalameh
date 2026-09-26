"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  CircleAlert,
  ListChecks,
  MapPin,
} from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { formatDate, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarView } from "../../scheduling-plan-calendar-view"
import { SchedulingPlanPublicationStatus } from "../../scheduling-plan-publication-status"
import { SchedulingPlanValidationResult } from "../../scheduling-plan-validation-result"
import { SchedulingProposalDetailsItem } from "../../scheduling-proposal-details-item"
import { SchedulingUnresolvedRequirementItem } from "../../scheduling-unresolved-requirement-item"
import { SchedulingWarningList } from "../../scheduling-warning-list"

interface ContentProps {
  plan: SchedulingPlanDetailsDto
  isSelected: boolean
  validationResult: SchedulingPlanValidation | undefined
}

export function Content({ plan, isSelected, validationResult }: ContentProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">(
    "calendar"
  )
  const missingClassCount = plan.unresolvedRequirements.reduce(
    (sum, requirement) => sum + requirement.missingClassCount,
    0
  )

  return (
    <div className="flex flex-col gap-6 px-6 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
      <dl className="grid gap-4 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">{t("term")}</dt>
          <dd className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <CalendarRange aria-hidden className="size-4" />
            {plan.run.term.title}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("branch")}</dt>
          <dd className="mt-1 flex items-center gap-2 font-semibold text-foreground">
            <MapPin aria-hidden className="size-4" />
            {plan.run.branch?.name ?? t("allBranches")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("generatedAt")}</dt>
          <dd className="mt-1 font-semibold text-foreground">
            {formatDate(plan.generatedAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("qualityIndex")}</dt>
          <dd className="mt-1 font-semibold text-foreground">
            {plan.qualityIndex == null
              ? "—"
              : new Intl.NumberFormat(locale, {
                  style: "percent",
                  maximumFractionDigits: 2,
                }).format(plan.qualityIndex / 100)}
          </dd>
        </div>
      </dl>
      {plan.status === "PUBLISHED" && (
        <SchedulingPlanPublicationStatus plan={plan} />
      )}
      {plan.status === "SELECTED" && validationResult && (
        <SchedulingPlanValidationResult
          result={validationResult}
          proposals={plan.proposals}
        />
      )}
      {plan.warnings.length > 0 && (
        <section aria-labelledby="plan-warnings-title">
          <h3 id="plan-warnings-title" className="font-bold text-foreground">
            {t("planWarnings")}
          </h3>
          <div className="mt-3">
            <SchedulingWarningList
              warnings={plan.warnings}
              ariaLabel={t("planWarnings")}
            />
          </div>
        </section>
      )}
      <Separator />
      <section aria-labelledby="plan-proposals-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3
              id="plan-proposals-title"
              className="flex items-center gap-2 font-bold text-foreground"
            >
              <ListChecks aria-hidden className="size-5" />
              {t("proposalsTitle")}
            </h3>
            <Badge variant="secondary">
              {t("proposalCount", {
                count: formatNumber(plan.proposals.length, locale),
              })}
            </Badge>
          </div>
          <div
            role="radiogroup"
            aria-label={t("proposalsTitle")}
            className="flex items-center rounded-xl border border-border bg-muted/50 p-1"
          >
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-pressed={viewMode === "calendar"}
            >
              <CalendarDays aria-hidden className="size-3.5" />
              <span>{t("calendarView.toggleCalendar")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              aria-pressed={viewMode === "list"}
            >
              <ListChecks aria-hidden className="size-3.5" />
              <span>{t("calendarView.toggleList")}</span>
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {viewMode === "calendar" ? (
            <SchedulingPlanCalendarView
              proposals={plan.proposals}
              canEdit={isSelected && plan.status === "SELECTED"}
            />
          ) : plan.proposals.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {plan.proposals.map((proposal) => (
                <SchedulingProposalDetailsItem
                  key={proposal.id}
                  proposal={proposal}
                  canEdit={isSelected && plan.status === "SELECTED"}
                />
              ))}
            </ul>
          ) : (
            <Empty variant="compact" className="mt-4 bg-muted/30">
              <EmptyMedia>
                <BookOpenCheck aria-hidden />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("noProposals.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("noProposals.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </section>
      {plan.unresolvedRequirements.length > 0 && (
        <section aria-labelledby="plan-unresolved-title">
          <div className="flex items-center justify-between gap-3">
            <h3
              id="plan-unresolved-title"
              className="flex items-center gap-2 font-bold text-foreground"
            >
              <CircleAlert aria-hidden className="size-5" />
              {t("unresolvedTitle")}
            </h3>
            <Badge variant="warning">
              {t("missingCount", {
                count: formatNumber(missingClassCount, locale),
              })}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {t("unresolvedDescription")}
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {plan.unresolvedRequirements.map((requirement) => (
              <SchedulingUnresolvedRequirementItem
                key={requirement.id}
                requirement={requirement}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
