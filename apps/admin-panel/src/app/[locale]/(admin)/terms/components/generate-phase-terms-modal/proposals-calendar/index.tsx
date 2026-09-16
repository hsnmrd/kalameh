"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Info } from "lucide-react"
import type {
  GeneratedTermProposal,
  CompensatorySession,
} from "@workspace/types"
import { TermRangesLegend } from "./term-ranges-legend"
import { CalendarGrid } from "./calendar-grid"

export interface ProposalsCalendarProps {
  proposals: GeneratedTermProposal[]
  onStartDateChange: (index: number, newStartDate: string) => void
  onToggleHoliday?: (dateYmd: string) => void
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

export function ProposalsCalendar({
  proposals,
  onStartDateChange,
  onToggleHoliday,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale,
  observeOfficialHolidays,
  customOffDays,
  activeDismissedHolidays,
  compensatorySessions,
}: ProposalsCalendarProps) {
  const t = useTranslations("terms")
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  const [rawSelectedTermIndex, setSelectedTermIndex] = React.useState<number>(0)

  const selectedTermIndex =
    rawSelectedTermIndex >= proposals.length && proposals.length > 0
      ? 0
      : rawSelectedTermIndex

  return (
    <div className="flex flex-col gap-4">
      {/* Informative helper hint */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{t("batchModal.dateShiftHint")}</span>
      </div>

      {/* Legend & Term Selection Chips */}
      <TermRangesLegend
        proposals={proposals}
        selectedIndex={selectedTermIndex}
        onSelectIndex={setSelectedTermIndex}
      />

      {/* Range Calendar Grid */}
      <CalendarGrid
        proposals={proposals}
        selectedTermIndex={selectedTermIndex}
        onStartDateChange={onStartDateChange}
        onToggleHoliday={onToggleHoliday}
        onAddCompensatorySession={onAddCompensatorySession}
        onRemoveCompensatorySession={onRemoveCompensatorySession}
        locale={activeLocale}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        activeDismissedHolidays={activeDismissedHolidays}
        compensatorySessions={compensatorySessions}
      />
    </div>
  )
}
