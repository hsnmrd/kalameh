"use client"

import { useTranslations } from "next-intl"
import { Pencil } from "lucide-react"
import {
  calculateUncoveredStudents,
  type CourseDemandSummaryDto,
  type SuggestedClassDto,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { StudentDemandBar } from "../student-demand-bar"

export interface DemandBreakdownCardProps {
  item: CourseDemandSummaryDto
  suggestions: SuggestedClassDto[]
  capacityLimit?: number
  isExpanded?: boolean
  onToggleExpand?: () => void
  onEdit?: () => void
  onCapacityChange?: (
    courseId: string,
    classKey: string,
    capacity: number
  ) => void
  onAddClass?: (courseId: string) => void
  onRemoveClass?: (courseId: string, classKey: string) => void
}

export function DemandBreakdownCard({
  item,
  suggestions,
  onEdit,
  onToggleExpand,
}: DemandBreakdownCardProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const uncovered = calculateUncoveredStudents(
    item.eligibleStudentsCount,
    suggestions.map((suggestedClass) => suggestedClass.capacity)
  )
  const isNoClassesNeeded =
    item.eligibleStudentsCount === 0 && suggestions.length === 0
  const handleEdit = onEdit ?? onToggleExpand

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xs transition-opacity",
        uncovered === 0
          ? "border-s-4 border-s-success"
          : "border-s-4 border-s-destructive",
        isNoClassesNeeded && "opacity-45 hover:opacity-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          {/* Course title with prerequisite in front */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {item.courseTitle}
            </span>
            {item.prerequisiteTitle && (
              <span className="text-xs text-muted-foreground">
                {t("prerequisite", { title: item.prerequisiteTitle })}
              </span>
            )}
          </div>
        </div>

        {handleEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("editClasses")} - ${item.courseTitle}`}
            onClick={handleEdit}
          >
            <Pencil className="size-4" aria-hidden />
            <span className="sr-only">{t("editClasses")}</span>
          </Button>
        )}
      </div>

      {/* Two-color linear bar with tiny icon numbers and class count */}
      <div className="rounded-xl bg-muted/30 px-3 py-2">
        <StudentDemandBar
          continuing={item.continuingStudentsCount}
          newStudents={item.newPlacementCount}
          total={item.eligibleStudentsCount}
          classesCount={suggestions.length}
          className="w-full"
        />
      </div>
    </div>
  )
}
