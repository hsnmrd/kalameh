"use client"

import { useLocale, useTranslations } from "next-intl"
import { Pencil, Plus, Users, X } from "lucide-react"
import {
  calculateUncoveredStudents,
  type CourseDemandSummaryDto,
  type SuggestedClassDto,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SuggestedClassControl } from "../suggested-class-control"

export interface DemandBreakdownCardProps {
  item: CourseDemandSummaryDto
  suggestions: SuggestedClassDto[]
  capacityLimit: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  onCapacityChange: (
    courseId: string,
    classKey: string,
    capacity: number
  ) => void
  onAddClass: (courseId: string) => void
  onRemoveClass: (courseId: string, classKey: string) => void
}

export function DemandBreakdownCard({
  item,
  suggestions,
  capacityLimit,
  isExpanded = false,
  onToggleExpand,
  onCapacityChange,
  onAddClass,
  onRemoveClass,
}: DemandBreakdownCardProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()
  const uncovered = calculateUncoveredStudents(
    item.eligibleStudentsCount,
    suggestions.map((suggestedClass) => suggestedClass.capacity)
  )
  const toggleActionLabel = isExpanded ? t("closeClasses") : t("editClasses")

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold text-foreground">
            {item.courseTitle}
          </span>
          {item.prerequisiteTitle && (
            <span className="text-xs text-muted-foreground">
              {t("prerequisite", { title: item.prerequisiteTitle })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {t("classesCountSummary", {
              count: formatNumber(suggestions.length, locale),
            })}
          </Badge>
          {uncovered > 0 ? (
            <Badge variant="destructive">
              {t("uncovered", { count: formatNumber(uncovered, locale) })}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("covered")}</Badge>
          )}
          {onToggleExpand && (
            <Button
              type="button"
              variant={isExpanded ? "secondary" : "ghost"}
              size="icon-sm"
              aria-expanded={isExpanded}
              aria-label={`${toggleActionLabel} - ${item.courseTitle}`}
              onClick={onToggleExpand}
            >
              {isExpanded ? <X aria-hidden /> : <Pencil aria-hidden />}
              <span className="sr-only">{toggleActionLabel}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          {t("studentsDetail", {
            continuing: formatNumber(item.continuingStudentsCount, locale),
            new: formatNumber(item.newPlacementCount, locale),
            total: formatNumber(item.eligibleStudentsCount, locale),
          })}
        </span>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {suggestions.map((suggestedClass, index) => (
            <SuggestedClassControl
              key={suggestedClass.key}
              item={suggestedClass}
              index={index}
              courseTitle={item.courseTitle}
              capacityLimit={capacityLimit}
              onCapacityChange={(capacity) =>
                onCapacityChange(item.courseId, suggestedClass.key, capacity)
              }
              onRemove={() => onRemoveClass(item.courseId, suggestedClass.key)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => onAddClass(item.courseId)}
          >
            <Plus aria-hidden />
            {t("addClass")}
          </Button>
        </div>
      )}
    </div>
  )
}
