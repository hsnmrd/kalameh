"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, Layers } from "lucide-react"
import type { SchedulingTermSummaryDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"

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
      <div className="flex h-14 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-5 text-foreground" />
      </div>
    )
  }

  if (!term) {
    return (
      <div className="flex h-14 w-full items-center gap-2.5 rounded-2xl border border-dashed border-border bg-muted/40 px-3.5 text-muted-foreground sm:px-4">
        <Calendar className="size-5 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium sm:text-sm">
          {t("notEligible.title")}
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-14 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 sm:gap-4 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calendar className="size-4.5" />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="truncate text-xs font-bold text-foreground sm:text-sm">
              {term.title}
            </span>
            {term.operatingPhase && (
              <Badge
                variant="secondary"
                className="hidden h-5 shrink-0 gap-1 px-1.5 text-[11px] sm:inline-flex"
              >
                <Layers className="size-3" />
                <span>{term.operatingPhase.title}</span>
              </Badge>
            )}
            {term.isActive && (
              <span className="size-2 shrink-0 rounded-full bg-success" />
            )}
          </div>
          <span className="hidden truncate text-[11px] text-muted-foreground sm:inline-block">
            {formatDate(term.startDate)} — {formatDate(term.endDate)}
          </span>
        </div>
      </div>
    </div>
  )
}
