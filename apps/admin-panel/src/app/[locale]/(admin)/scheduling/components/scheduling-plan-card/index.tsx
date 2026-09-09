"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  BookOpenCheck,
  Check,
  CircleAlert,
  Clock3,
  Gauge,
  ListTree,
  MousePointerClick,
  Sparkles,
  TriangleAlert,
  UsersRound,
} from "lucide-react"
import { PERMISSIONS, type SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

interface SchedulingPlanCardProps {
  plan: SchedulingPlanDetailsDto
  isRecommended: boolean
  isSelected: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  onSelect: () => void
  onViewDetails: () => void
}

const percent = (value: number | null | undefined, locale: string) =>
  value == null
    ? "—"
    : new Intl.NumberFormat(locale, {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(value / 100)

export function SchedulingPlanCard({
  plan,
  isRecommended,
  isSelected,
  isSelectionPending,
  isSelecting,
  onSelect,
  onViewDetails,
}: SchedulingPlanCardProps) {
  const t = useTranslations("scheduling.comparison")
  const locale = useLocale()
  const timeDiversity = plan.scoreBreakdown.criteria.find(
    (criterion) => criterion.code === "SC_TIME_PATTERN_DIVERSITY"
  )
  const missingClassCount = plan.unresolvedRequirements.reduce(
    (sum, requirement) => sum + requirement.missingClassCount,
    0
  )
  const warningCount =
    plan.warnings.length +
    plan.proposals.reduce((sum, proposal) => sum + proposal.warnings.length, 0)

  const metrics = [
    {
      key: "coverage",
      icon: UsersRound,
      value: percent(plan.coveragePercent, locale),
    },
    {
      key: "minimumCoverage",
      icon: Gauge,
      value: percent(plan.minimumCourseCoveragePercent, locale),
    },
    {
      key: "timeDiversity",
      icon: Clock3,
      value: percent(
        timeDiversity?.normalizedScore == null
          ? null
          : timeDiversity.normalizedScore * 100,
        locale
      ),
    },
    {
      key: "proposals",
      icon: BookOpenCheck,
      value: formatNumber(plan.proposals.length, locale),
    },
  ] as const

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t("rank", { rank: formatNumber(plan.rank, locale) })}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">
            {t("plan", { rank: formatNumber(plan.rank, locale) })}
          </h3>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {isSelected && (
            <Badge>
              <Check aria-hidden data-icon="inline-start" />
              {t("selection.badge")}
            </Badge>
          )}
          {isRecommended && (
            <Badge variant="success">
              <Sparkles aria-hidden data-icon="inline-start" />
              {t("recommended")}
            </Badge>
          )}
        </div>
      </div>

      <div className="bg-muted/50 px-5 py-5">
        <p className="text-xs font-semibold text-muted-foreground">
          {t("qualityIndex")}
        </p>
        <p className="mt-1 text-3xl font-black tracking-tight text-foreground">
          {percent(plan.qualityIndex, locale)}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("weightedPoints", {
            earned: formatNumber(plan.earnedWeightedPoints, locale),
            applicable: formatNumber(plan.applicableWeightedPoints, locale),
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border">
        {metrics.map(({ key, icon: Icon, value }) => (
          <div key={key} className="bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon aria-hidden className="size-4" />
              <span className="text-xs font-medium">{t(`metrics.${key}`)}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto p-5">
        <Separator className="mb-4" />
        <div className="flex flex-wrap gap-2">
          <Badge variant={missingClassCount > 0 ? "warning" : "outline"}>
            <CircleAlert aria-hidden data-icon="inline-start" />
            {t("missingClasses", {
              count: formatNumber(missingClassCount, locale),
            })}
          </Badge>
          <Badge variant={warningCount > 0 ? "secondary" : "outline"}>
            <TriangleAlert aria-hidden data-icon="inline-start" />
            {t("warnings", { count: formatNumber(warningCount, locale) })}
          </Badge>
        </div>
        <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
          <Button
            type="button"
            variant={isSelected ? "secondary" : "default"}
            className="mt-4 w-full"
            disabled={
              isSelectionPending ||
              isSelected ||
              !["DRAFT", "SELECTED"].includes(plan.status)
            }
            onClick={onSelect}
          >
            {isSelecting ? (
              <Spinner data-icon="inline-start" />
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
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-full"
          onClick={onViewDetails}
        >
          <ListTree aria-hidden data-icon="inline-start" />
          {t("viewDetails")}
        </Button>
      </div>
    </article>
  )
}
