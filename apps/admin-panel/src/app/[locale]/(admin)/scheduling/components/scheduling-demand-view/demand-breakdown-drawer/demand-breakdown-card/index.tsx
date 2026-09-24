"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Users } from "lucide-react"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { Counter } from "@workspace/ui/components/counter"
import { FieldLabel } from "@workspace/ui/components/field"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { CourseAdjustment } from ".."

export interface DemandBreakdownCardProps {
  item: CourseDemandSummaryDto
  currentClassCount: number
  currentCapacity: number
  onAdjustmentChange: (courseId: string, changes: CourseAdjustment) => void
}

export function DemandBreakdownCard({
  item,
  currentClassCount,
  currentCapacity,
  onAdjustmentChange,
}: DemandBreakdownCardProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xs">
      {/* Course Title and Prerequisite */}
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-foreground">
          {item.courseTitle}
        </span>
        {item.prerequisiteTitle && (
          <span className="text-xs text-muted-foreground">
            {t("prerequisite", {
              title: item.prerequisiteTitle,
            })}
          </span>
        )}
      </div>

      {/* Applicants Breakdown */}
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

      {/* Editable Inputs: Suggested Classes & Capacity */}
      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor={`suggested-classes-${item.courseId}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {t("suggestedClasses")}
          </FieldLabel>
          <Counter
            id={`suggested-classes-${item.courseId}`}
            size="sm"
            min={0}
            max={50}
            value={currentClassCount}
            onValueChange={(val) => {
              onAdjustmentChange(item.courseId, {
                suggestedClassCount: val,
              })
            }}
            className="w-full"
            aria-label={`${t("suggestedClasses")} - ${item.courseTitle}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor={`capacity-${item.courseId}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {t("capacity")}
          </FieldLabel>
          <Counter
            id={`capacity-${item.courseId}`}
            size="sm"
            min={1}
            max={100}
            value={currentCapacity}
            onValueChange={(val) => {
              onAdjustmentChange(item.courseId, {
                capacity: val,
              })
            }}
            className="w-full"
            aria-label={`${t("capacity")} - ${item.courseTitle}`}
          />
        </div>
      </div>
    </div>
  )
}
