"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Info,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { GeneratedTermProposal } from "@workspace/types"
import { ProposalsCalendar } from "../proposals-calendar"
import { ProposalsTable } from "../proposals-table"

export interface StepPreviewProps {
  proposals: GeneratedTermProposal[]
  viewMode: "calendar" | "table"
  onViewModeChange: (mode: "calendar" | "table") => void
  onTitleChange: (index: number, newTitle: string) => void
  onStartDateChange: (index: number, newStartDate: string) => void
  locale?: "fa" | "en"
}

export function StepPreview({
  proposals,
  viewMode,
  onViewModeChange,
  onTitleChange,
  onStartDateChange,
  locale,
}: StepPreviewProps) {
  const t = useTranslations("terms")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">
          {t("batchModal.previewTitle", { count: proposals.length })}
        </span>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
          <Button
            type="button"
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="xs"
            onClick={() => onViewModeChange("calendar")}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          >
            <CalendarIcon className="size-3.5" />
            <span>{t("batchModal.calendarView")}</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "ghost"}
            size="xs"
            onClick={() => onViewModeChange("table")}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          >
            <TableIcon className="size-3.5" />
            <span>{t("batchModal.tableView")}</span>
          </Button>
        </div>
      </div>

      {proposals.length > 0 ? (
        viewMode === "calendar" ? (
          <ProposalsCalendar
            proposals={proposals}
            onStartDateChange={onStartDateChange}
            locale={locale}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{t("batchModal.dateShiftHint")}</span>
            </div>
            <ProposalsTable
              proposals={proposals}
              onTitleChange={onTitleChange}
              onStartDateChange={onStartDateChange}
              locale={locale}
            />
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("batchModal.noProposals")}
        </div>
      )}
    </div>
  )
}
