"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, Layers, BookOpen } from "lucide-react"
import type { SchedulingTermSummaryDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface TermSummaryBarProps {
  term: SchedulingTermSummaryDto | null | undefined
  isLoading?: boolean
}

export function TermSummaryBar({ term, isLoading }: TermSummaryBarProps) {
  const t = useTranslations("scheduling.termsList")
  const locale = useLocale()

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
      <div className="flex h-16 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-6 text-foreground" />
      </div>
    )
  }

  if (!term) return null

  const renderStatusBadge = () => {
    switch (term.schedulingStatus) {
      case "PUBLISHED":
        return (
          <Badge
            variant="secondary"
            className="border-success/30 bg-success/10 text-success"
          >
            {t("statuses.PUBLISHED")}
          </Badge>
        )
      case "SCHEDULED":
        return <Badge variant="default">{t("statuses.SCHEDULED")}</Badge>
      case "GENERATING":
        return (
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 text-primary"
          >
            <Spinner className="size-3" />
            <span>{t("statuses.GENERATING")}</span>
          </Badge>
        )
      case "READY_TO_SCHEDULE":
        return (
          <Badge variant="outline" className="border-warning/40 text-warning">
            {t("statuses.READY_TO_SCHEDULE")}
          </Badge>
        )
      case "NO_REQUIREMENTS":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {t("statuses.NO_REQUIREMENTS")}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calendar className="size-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {term.title}
            </span>
            {term.operatingPhase && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Layers className="size-3" />
                <span>{term.operatingPhase.title}</span>
              </Badge>
            )}
            {term.isActive && (
              <span className="size-2 rounded-full bg-success" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(term.startDate)} — {formatDate(term.endDate)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 sm:border-t-0 sm:pt-0">
        <Badge
          variant="outline"
          className="gap-1 text-xs text-muted-foreground"
        >
          <BookOpen className="size-3" />
          <span>
            {t("requirementsBadge", {
              count: formatNumber(term.requirementsCount, locale),
              classes: formatNumber(term.totalRequiredClasses, locale),
            })}
          </span>
        </Badge>

        {renderStatusBadge()}
      </div>
    </div>
  )
}
