"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ArrowDownRight, ArrowUpRight, Check, User } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import type { FreeMasterItem } from "../helper/teacher-level-comparison.helper"

export interface FreeMasterCardProps {
  item: FreeMasterItem
  canAssign: boolean
  isPending: boolean
  isAssigning: boolean
  onAssign: (teacherId: string) => void
}

export function FreeMasterCard({
  item,
  canAssign,
  isPending,
  isAssigning,
  onAssign,
}: FreeMasterCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const teacherFullName =
    `${item.teacher.firstName} ${item.teacher.lastName}`.trim()
  const isQualified = item.comparison.isQualified

  return (
    <div
      data-testid={`free-master-item-${item.teacher.id}`}
      data-qualified={isQualified ? "true" : "false"}
      data-level-status={item.comparison.status}
      className={cn(
        "flex h-full flex-col justify-between gap-3 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center",
        isQualified
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border/50 bg-muted/20 opacity-75"
      )}
    >
      {/* Teacher Profile & Level Badges */}
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/80">
          {item.teacher.avatarUrl ? (
            <Image
              src={getAssetUrl(item.teacher.avatarUrl)}
              alt={teacherFullName}
              width={40}
              height={40}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <User aria-hidden className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {teacherFullName}
            </span>
            {/* Level Comparison Badge */}
            {item.comparison.status === "DIRECT_MATCH" && (
              <Badge
                variant="outline"
                className="gap-1 border-success/40 bg-success/10 text-xs text-success"
              >
                <Check aria-hidden className="size-3 text-success" />
                <span>{t("staffingFallback.directMatchBadge")}</span>
              </Badge>
            )}
            {item.comparison.status === "HIGHER_LEVEL" && (
              <Badge
                variant="outline"
                className="gap-1 border-primary/40 bg-primary/10 text-xs text-primary"
              >
                <ArrowUpRight aria-hidden className="size-3 text-primary" />
                <span>
                  {t("staffingFallback.higherLevelBadge", {
                    course: item.comparison.higherCourse.title,
                  })}
                </span>
              </Badge>
            )}
            {item.comparison.status === "LOWER_LEVEL" && (
              <Badge
                variant="outline"
                className="gap-1 border-warning/40 bg-warning/10 text-xs text-warning-foreground"
              >
                <ArrowDownRight
                  aria-hidden
                  className="size-3 text-warning-foreground"
                />
                <span>
                  {t("staffingFallback.lowerLevelBadge", {
                    course: item.comparison.lowerCourse.title,
                  })}
                </span>
              </Badge>
            )}
            {item.comparison.status === "UNRELATED" && (
              <Badge
                variant="outline"
                className="border-border/80 bg-muted/40 text-xs text-muted-foreground"
              >
                <span>{t("staffingFallback.unrelatedLevelBadge")}</span>
              </Badge>
            )}
          </div>

          {/* Teachable Courses Range */}
          {item.courseRangeSummary && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("staffingFallback.teachableCoursesLabel")}{" "}
              </span>
              <span>{item.courseRangeSummary}</span>
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          data-testid={`assign-free-master-btn-${item.teacher.id}`}
          disabled={!isQualified || !canAssign || isPending}
          onClick={() => onAssign(item.teacher.id)}
          className="shrink-0 gap-1.5 font-medium"
        >
          {isAssigning ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <Check aria-hidden className="size-3.5" />
              <span>{t("staffingFallback.assignMaster")}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
