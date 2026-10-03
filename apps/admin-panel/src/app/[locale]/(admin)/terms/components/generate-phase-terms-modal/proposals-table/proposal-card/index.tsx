"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { GeneratedTermProposal } from "@workspace/types"

export interface ProposalCardProps {
  proposal: GeneratedTermProposal
  index: number
  minDate?: Date
  onTitleChange: (index: number, newTitle: string) => void
  onStartDateChange: (index: number, newStartDate: string) => void
  locale?: "fa" | "en"
}

export function ProposalCard({
  proposal,
  index,
  minDate,
  onTitleChange,
  onStartDateChange,
  locale,
}: ProposalCardProps) {
  const t = useTranslations("terms")
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-card-foreground shadow-2xs">
      {/* Row 1: Number Badge & Editable Title */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
        >
          {index + 1}
        </Badge>
        <Input
          value={proposal.title}
          onChange={(e) => onTitleChange(index, e.target.value)}
          placeholder={t("batchModal.colTitle")}
          className="h-9 min-w-0 flex-1 rounded-xl px-3 text-sm font-semibold"
        />
      </div>

      {/* Row 2: Meta info strip (Covered Months & Badges) */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {proposal.monthNamesFa}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant="secondary"
            className="rounded-lg px-2 py-0.5 text-xs font-semibold"
          >
            {t("batchModal.sessionsBadge", {
              count: formatNumber(proposal.sessionsCount ?? 18, activeLocale),
            })}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-lg px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {t("batchModal.daysBadge", {
              count: formatNumber(proposal.daysCount, activeLocale),
            })}
          </Badge>
          {proposal.holidaysCount > 0 && (
            <Badge
              variant="outline"
              className="rounded-lg border-destructive/30 px-1.5 py-0.5 text-[11px] text-destructive"
            >
              {t("batchModal.holidaysCountBadge", {
                count: formatNumber(proposal.holidaysCount, activeLocale),
              })}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 3: Start Date (DatePicker) and End Date side-by-side in 2 columns */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("batchModal.colStart")}
          </span>
          <DatePicker
            value={proposal.startDate}
            minDate={minDate}
            onChange={(val) => {
              if (val) {
                onStartDateChange(index, val)
              }
            }}
            locale={activeLocale}
            clearable={false}
            showOffDays
            className="h-9 min-w-0 rounded-xl px-2.5 text-xs font-medium"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("batchModal.colEnd")}
          </span>
          <div className="flex h-9 min-w-0 items-center rounded-xl border border-border/60 bg-muted/40 px-2.5 text-xs font-semibold text-foreground">
            <span className="truncate">{proposal.endDateJalali}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
