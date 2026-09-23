"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { BookOpen, Check } from "lucide-react"
import type { CourseDemandSummaryDto } from "@workspace/types"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface DemandListProps {
  items: CourseDemandSummaryDto[]
  isLoading: boolean
}

export function DemandList({ items, isLoading }: DemandListProps) {
  const t = useTranslations("scheduling")
  const tDemand = useTranslations("scheduling.demand")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Empty variant="ghost" className="min-h-56">
        <EmptyMedia variant="icon">
          <BookOpen className="size-7" aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{tDemand("emptyDemand")}</EmptyTitle>
          <EmptyDescription>{tDemand("emptyDemandDesc")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const hasStudents = item.eligibleStudentsCount > 0

        return (
          <MobileListItem key={item.courseId} isLast={isLast}>
            <MobileListItemIcon>
              <BookOpen className="size-5" aria-hidden />
            </MobileListItemIcon>

            <MobileListItemContent
              primary={
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground">
                    {item.courseTitle}
                  </span>
                  {item.existingRequirementId ? (
                    <Badge variant="success" className="gap-1 text-[10px]">
                      <Check className="size-3 text-success-foreground" />
                      <span>
                        {tDemand("columns.registeredCount", {
                          count: formatNumber(
                            item.currentRequirementClassCount ?? 0,
                            locale
                          ),
                        })}
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      {tDemand("columns.notRegistered")}
                    </Badge>
                  )}
                </div>
              }
              secondary={
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  <span>
                    {tDemand("columns.totalStudents")}:{" "}
                    {t("planDetails.people", {
                      count: formatNumber(item.eligibleStudentsCount, locale),
                    })}
                    {hasStudents &&
                      (item.passedPrerequisiteCount > 0 ||
                        item.newPlacementCount > 0) &&
                      ` (${tDemand("columns.passed")}: ${formatNumber(item.passedPrerequisiteCount, locale)} · ${tDemand("columns.placement")}: ${formatNumber(item.newPlacementCount, locale)})`}
                  </span>
                </div>
              }
            />

            <MobileListItemTrailing>
              {item.suggestedClassCount > 0 ? (
                <Badge variant="secondary" className="text-xs font-bold">
                  {t("planDetails.proposalCount", {
                    count: formatNumber(item.suggestedClassCount, locale),
                  })}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {formatNumber(0, locale)}
                </span>
              )}
            </MobileListItemTrailing>
          </MobileListItem>
        )
      })}
    </MobileList>
  )
}
