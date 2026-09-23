"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import type { SchedulingTermSummaryDto } from "@workspace/types"
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
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingTermsListProps {
  terms: SchedulingTermSummaryDto[]
  isLoading: boolean
}

export function SchedulingTermsList({
  terms,
  isLoading,
}: SchedulingTermsListProps) {
  const t = useTranslations("scheduling.termsList")
  const locale = useLocale()
  const isRtl = locale === "fa"
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

  const formatDate = React.useCallback(
    (dateVal: string | Date) => {
      try {
        const d = new Date(dateVal)
        return new Intl.DateTimeFormat(
          locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        ).format(d)
      } catch {
        return String(dateVal)
      }
    },
    [locale]
  )

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!terms || terms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Calendar className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("empty.title")}</EmptyTitle>
          <EmptyDescription>{t("empty.description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {terms.map((term, index) => {
        const isLast = index === terms.length - 1

        const renderStatusBadge = () => {
          switch (term.schedulingStatus) {
            case "PUBLISHED":
              return (
                <Badge
                  variant="secondary"
                  className="border-success/30 bg-success/10 text-[10px] text-success"
                >
                  {t("statuses.PUBLISHED")}
                </Badge>
              )
            case "SCHEDULED":
              return (
                <Badge variant="default" className="text-[10px]">
                  {t("statuses.SCHEDULED")}
                </Badge>
              )
            case "GENERATING":
              return (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/40 text-[10px] text-primary"
                >
                  <Spinner className="size-2.5" />
                  <span>{t("statuses.GENERATING")}</span>
                </Badge>
              )
            case "READY_TO_SCHEDULE":
              return (
                <Badge
                  variant="outline"
                  className="border-warning/40 text-[10px] text-warning"
                >
                  {t("statuses.READY_TO_SCHEDULE")}
                </Badge>
              )
            case "NO_REQUIREMENTS":
            default:
              return (
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  {t("statuses.NO_REQUIREMENTS")}
                </Badge>
              )
          }
        }

        return (
          <Link
            key={term.id}
            href={`/${locale}/scheduling/${term.id}`}
            className="block focus-visible:outline-hidden"
          >
            <MobileListItem
              isLast={isLast}
              className="flex items-center gap-3 p-3.5"
            >
              <MobileListItemIcon>
                <Calendar className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      {term.title}
                    </span>
                    {term.operatingPhase && (
                      <span className="text-[11px] text-muted-foreground">
                        ({term.operatingPhase.title})
                      </span>
                    )}
                  </div>
                }
                secondary={
                  <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>
                      {formatDate(term.startDate)} — {formatDate(term.endDate)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {term.requirementsCount > 0 ? (
                        <span className="font-medium text-foreground">
                          {t("requirementsBadge", {
                            count: formatNumber(term.requirementsCount, locale),
                            classes: formatNumber(
                              term.totalRequiredClasses,
                              locale
                            ),
                          })}
                        </span>
                      ) : (
                        <span>{t("noRequirements")}</span>
                      )}
                    </div>
                  </div>
                }
              />

              <MobileListItemTrailing className="flex flex-col items-end gap-2">
                {renderStatusBadge()}
                <ChevronIcon className="size-4 text-muted-foreground" />
              </MobileListItemTrailing>
            </MobileListItem>
          </Link>
        )
      })}
    </MobileList>
  )
}
