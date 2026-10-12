"use client"

import { useLocale, useTranslations } from "next-intl"
import { TrendingUp, UserPlus, Users } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface StudentDemandBarProps {
  continuing: number
  newStudents: number
  total: number
  classesCount?: number
  showTotal?: boolean
  className?: string
}

export function StudentDemandBar({
  continuing,
  newStudents,
  total,
  classesCount,
  showTotal = false,
  className,
}: StudentDemandBarProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()

  const bothZero = continuing === 0 && newStudents === 0

  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      title={t("studentsDetail", {
        continuing: formatNumber(continuing, locale),
        new: formatNumber(newStudents, locale),
        total: formatNumber(total, locale),
      })}
    >
      {/* 1. Number of classes */}
      {classesCount !== undefined && (
        <Badge
          variant="outline"
          className="shrink-0 px-2 py-0.5 text-xs font-semibold"
        >
          {t("classesCountSummary", {
            count: formatNumber(classesCount, locale),
          })}
        </Badge>
      )}

      {/* 2. Linear colors (2-Color Linear Progress Bar) */}
      <div className="flex h-2 min-w-16 flex-1 items-center gap-0.5 overflow-hidden rounded-full bg-muted/60 p-0.5">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            flex: bothZero ? 1 : continuing > 0 ? continuing : undefined,
            width: !bothZero && continuing === 0 ? "8px" : undefined,
            minWidth: "8px",
          }}
        />
        <div
          className="h-full rounded-full bg-warning transition-all duration-300"
          style={{
            flex: bothZero ? 1 : newStudents > 0 ? newStudents : undefined,
            width: !bothZero && newStudents === 0 ? "8px" : undefined,
            minWidth: "8px",
          }}
        />
      </div>

      {/* 3. Chips of student's number */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Badge
          variant="outline"
          className="gap-1 border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
          title={t("continuingTooltip", {
            count: formatNumber(continuing, locale),
          })}
        >
          <TrendingUp className="size-3 shrink-0 text-primary" aria-hidden />
          <span>{formatNumber(continuing, locale)}</span>
        </Badge>
        <Badge
          variant="outline"
          className="gap-1 border-warning/35 bg-warning/15 px-2 py-0.5 text-xs font-semibold text-foreground"
          title={t("newPlacementTooltip", {
            count: formatNumber(newStudents, locale),
          })}
        >
          <UserPlus className="size-3 shrink-0 text-foreground" aria-hidden />
          <span>{formatNumber(newStudents, locale)}</span>
        </Badge>
        {showTotal && (
          <Badge
            variant="secondary"
            className="gap-1 px-2 py-0.5 text-xs font-semibold text-muted-foreground"
            title={t("totalTooltip", {
              count: formatNumber(total, locale),
            })}
          >
            <Users
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>{formatNumber(total, locale)}</span>
          </Badge>
        )}
      </div>
    </div>
  )
}
