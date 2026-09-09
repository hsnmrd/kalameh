"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  BookOpenCheck,
  CalendarRange,
  CircleAlert,
  ListChecks,
  MapPin,
} from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { formatDate, formatNumber } from "@workspace/ui/lib/utils"
import { useSchedulingPlanValidation } from "../../hooks/use-scheduling-plan-validation"
import { SchedulingPlanDetailsFooter } from "../scheduling-plan-details-footer"
import { SchedulingPlanPublicationStatus } from "../scheduling-plan-publication-status"
import { SchedulingPlanValidationResult } from "../scheduling-plan-validation-result"
import { SchedulingProposalDetailsItem } from "../scheduling-proposal-details-item"
import { SchedulingUnresolvedRequirementItem } from "../scheduling-unresolved-requirement-item"
import { SchedulingWarningList } from "../scheduling-warning-list"

interface SchedulingPlanDetailsDialogProps {
  plan: SchedulingPlanDetailsDto
  isRecommended: boolean
  isSelected: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  onSelect: () => void
  onClose: () => void
}

export function SchedulingPlanDetailsDialog({
  plan,
  isRecommended,
  isSelected,
  isSelectionPending,
  isSelecting,
  onSelect,
  onClose,
}: SchedulingPlanDetailsDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const missingClassCount = plan.unresolvedRequirements.reduce(
    (sum, requirement) => sum + requirement.missingClassCount,
    0
  )
  const validation = useSchedulingPlanValidation(plan.id, plan.updatedAt)

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="lg:flex lg:max-h-[90dvh] lg:max-w-4xl lg:flex-col lg:overflow-hidden">
        <ResponsiveDialogHeader>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <ResponsiveDialogTitle>
                {t("title", { rank: formatNumber(plan.rank, locale) })}
              </ResponsiveDialogTitle>
              {isRecommended && (
                <Badge variant="success">{t("recommended")}</Badge>
              )}
              {isSelected && <Badge>{t("selected")}</Badge>}
              {plan.status === "PUBLISHED" && (
                <Badge variant="success">{t("published")}</Badge>
              )}
              {plan.status === "REJECTED" && (
                <Badge variant="secondary">{t("rejected")}</Badge>
              )}
            </div>
            <ResponsiveDialogDescription>
              {plan.status === "PUBLISHED"
                ? t("publishedDescription")
                : t("description")}
            </ResponsiveDialogDescription>
          </div>
          <ResponsiveDialogCloseButton aria-label={t("close")} />
        </ResponsiveDialogHeader>

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
              <dt className="text-xs text-muted-foreground">
                {t("generatedAt")}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">
                {formatDate(plan.generatedAt, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("qualityIndex")}
              </dt>
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

          {plan.status === "SELECTED" && validation.result && (
            <SchedulingPlanValidationResult
              result={validation.result}
              proposals={plan.proposals}
            />
          )}

          {plan.warnings.length > 0 && (
            <section aria-labelledby="plan-warnings-title">
              <h3
                id="plan-warnings-title"
                className="font-bold text-foreground"
              >
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
            <div className="flex items-center justify-between gap-3">
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
            {plan.proposals.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
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

        <SchedulingPlanDetailsFooter
          plan={plan}
          validationResult={validation.result}
          hasValidationResult={Boolean(validation.result)}
          isSelectionPending={isSelectionPending}
          isSelecting={isSelecting}
          isValidationPending={validation.isPending}
          onClose={onClose}
          onSelect={onSelect}
          onValidationBlocked={validation.setResult}
          onValidate={validation.validate}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
