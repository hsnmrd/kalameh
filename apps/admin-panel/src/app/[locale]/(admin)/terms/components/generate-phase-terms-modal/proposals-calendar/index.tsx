"use client"

import * as React from "react"
import { useLocale } from "next-intl"
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
  numberOfMonths?: number
}

export function ProposalsCalendar({
  proposals,
  onStartDateChange,
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale,
  observeOfficialHolidays = true,
  customOffDays = [],
  activeDismissedHolidays = [],
  compensatorySessions,
  numberOfMonths,
}: ProposalsCalendarProps) {
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  const [rawSelectedTermIndex, setSelectedTermIndex] = React.useState<number>(0)

  const selectedTermIndex =
    rawSelectedTermIndex >= proposals.length && proposals.length > 0
      ? 0
      : rawSelectedTermIndex

  return (
    <div className="flex flex-col gap-4">
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
        onToggleCustomOffDay={onToggleCustomOffDay}
        onAddCompensatorySession={onAddCompensatorySession}
        onRemoveCompensatorySession={onRemoveCompensatorySession}
        locale={activeLocale}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        activeDismissedHolidays={activeDismissedHolidays}
        compensatorySessions={compensatorySessions}
        numberOfMonths={numberOfMonths}
      />
    </div>
  )
}
