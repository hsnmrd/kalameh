"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type {
  GeneratedTermProposal,
  CompensatorySession,
} from "@workspace/types"
import { ProposalsCalendar } from "../proposals-calendar"
import { ProposalsTable } from "../proposals-table"

export interface StepPreviewProps {
  proposals: GeneratedTermProposal[]
  viewMode: "calendar" | "table"
  onViewModeChange: (mode: "calendar" | "table") => void
  onTitleChange: (index: number, newTitle: string) => void
  onStartDateChange: (index: number, newStartDate: string) => void
  onToggleHoliday?: (dateYmd: string) => void
  onToggleCustomOffDay?: (dateYmd: string) => void
  onAddCompensatorySession?: (
    termIndex: number,
    session: CompensatorySession
  ) => void
  onRemoveCompensatorySession?: (termIndex: number, dateYmd: string) => void
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  activeDismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
}

export function StepPreview({
  proposals,
  viewMode,
  onViewModeChange,
  onTitleChange,
  onStartDateChange,
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale,
  observeOfficialHolidays,
  customOffDays,
  activeDismissedHolidays,
  compensatorySessions,
}: StepPreviewProps) {
  const t = useTranslations("terms")

  const imbalanceProposals = React.useMemo(() => {
    return proposals.filter((p) => p.hasSessionImbalance)
  }, [proposals])

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

      {/* Session Imbalance Error Alert */}
      {imbalanceProposals.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-destructive">
              {t("batchModal.sessionImbalanceWarning")}
            </span>
            <span className="leading-relaxed text-muted-foreground">
              {imbalanceProposals
                .map((p) => {
                  const even =
                    p.patternDetails?.find((d) => d.track === "EVEN")
                      ?.completedSessions ?? 0
                  const odd =
                    p.patternDetails?.find((d) => d.track === "ODD")
                      ?.completedSessions ?? 0
                  return `${p.title}: ${t("batchModal.sessionImbalanceDesc", {
                    even,
                    odd,
                    target: p.sessionsCount ?? 18,
                  })}`
                })
                .join(" | ")}
            </span>
          </div>
        </div>
      )}

      {proposals.length > 0 ? (
        viewMode === "calendar" ? (
          <ProposalsCalendar
            proposals={proposals}
            onStartDateChange={onStartDateChange}
            onToggleHoliday={onToggleHoliday}
            onToggleCustomOffDay={onToggleCustomOffDay}
            onAddCompensatorySession={onAddCompensatorySession}
            onRemoveCompensatorySession={onRemoveCompensatorySession}
            locale={locale}
            observeOfficialHolidays={observeOfficialHolidays}
            customOffDays={customOffDays}
            activeDismissedHolidays={activeDismissedHolidays}
            compensatorySessions={compensatorySessions}
          />
        ) : (
          <ProposalsTable
            proposals={proposals}
            onTitleChange={onTitleChange}
            onStartDateChange={onStartDateChange}
            locale={locale}
          />
        )
      ) : (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("batchModal.noProposals")}
        </div>
      )}
    </div>
  )
}
