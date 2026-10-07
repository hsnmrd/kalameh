"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"
import type { TermDto } from "@workspace/types"
import { getTermTheme } from "../../../../helper"

export interface CalendarLegendProps {
  terms?: TermDto[]
  allTerms?: TermDto[]
}

export function CalendarLegend({
  terms = [],
  allTerms = terms,
}: CalendarLegendProps) {
  const t = useTranslations("setting.offDays")

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
      {/* Distinguish and clearly declare each term */}
      {terms.length > 0 ? (
        terms.map((term) => {
          const theme = getTermTheme(term.id, allTerms)
          return (
            <div
              key={term.id}
              className="flex items-center gap-1.5 font-medium text-foreground"
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full shadow-2xs",
                  theme.dotColor
                )}
              />
              <span className="max-w-[140px] truncate">{term.title}</span>
            </div>
          )
        })
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span>{t("legendTermRange")}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary/20 ring-2 ring-primary/60" />
        <span>{t("legendSessionDay")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-destructive" />
        <span>{t("legendOfficialHoliday")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-warning" />
        <span>{t("legendCustomOff")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-muted-foreground/60" />
        <span>{t("legendWeekend")}</span>
      </div>
    </div>
  )
}
