"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, CalendarOff } from "lucide-react"
import { formatNumber } from "@workspace/ui/lib/utils"
import type {
  GeneratedTermProposal,
  CompensatorySession,
} from "@workspace/types"
import { TermRangesLegend } from "./term-ranges-legend"
import { CalendarGrid } from "./calendar-grid"

export interface ProposalsCalendarProps {
  proposals: GeneratedTermProposal[]
  selectedTermIndex?: number
  onSelectTermIndex?: (index: number) => void
  onStartDateChange?: (index: number, newStartDate: string) => void
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
  lockedTermIndex?: number
  readOnly?: boolean
  showLegend?: boolean
  dateConflicts?: Array<{
    termTitle: string
    conflictingTitle: string
    termIndex: number
  }>
  existingTerms?: Array<{
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  }>
}

export function ProposalsCalendar({
  proposals,
  selectedTermIndex: propSelectedTermIndex,
  onSelectTermIndex,
  onStartDateChange = () => {},
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
  lockedTermIndex,
  readOnly = false,
  showLegend = true,
  dateConflicts,
  existingTerms,
}: ProposalsCalendarProps) {
  const t = useTranslations("terms")
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  const [rawSelectedTermIndex, setRawSelectedTermIndex] =
    React.useState<number>(0)

  const selectedTermIndex =
    lockedTermIndex !== undefined
      ? lockedTermIndex
      : propSelectedTermIndex !== undefined
        ? propSelectedTermIndex
        : rawSelectedTermIndex >= proposals.length && proposals.length > 0
          ? 0
          : rawSelectedTermIndex

  const handleSelectIndex = React.useCallback(
    (index: number) => {
      if (lockedTermIndex !== undefined) {
        return
      }
      if (onSelectTermIndex) {
        onSelectTermIndex(index)
      } else {
        setRawSelectedTermIndex(index)
      }
    },
    [lockedTermIndex, onSelectTermIndex]
  )

  const activeTerm = proposals[selectedTermIndex]

  const activeConflicts = React.useMemo(() => {
    if (!activeTerm || !dateConflicts) return []
    return dateConflicts.filter(
      (c) =>
        c.termIndex === selectedTermIndex || c.termTitle === activeTerm.title
    )
  }, [activeTerm, dateConflicts, selectedTermIndex])

  const hasConflict = activeConflicts.length > 0
  const conflictingTitles = React.useMemo(() => {
    return Array.from(
      new Set(activeConflicts.map((c) => c.conflictingTitle))
    ).join("، ")
  }, [activeConflicts])

  const hasImbalance = Boolean(activeTerm?.hasSessionImbalance)
  const hasActiveError = hasConflict || hasImbalance
  const evenDetail = activeTerm?.patternDetails?.find((p) => p.track === "EVEN")
  const oddDetail = activeTerm?.patternDetails?.find((p) => p.track === "ODD")
  const holidaysCount = activeTerm?.holidaysCount ?? 0
  const showStatusBar =
    showLegend && activeTerm && (hasActiveError || holidaysCount > 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Legend & Term Selection Chips */}
      {showLegend && (
        <TermRangesLegend
          proposals={proposals}
          selectedIndex={selectedTermIndex}
          onSelectIndex={handleSelectIndex}
          lockedTermIndex={lockedTermIndex}
          dateConflicts={dateConflicts}
        />
      )}

      {/* Active Term Status Bar: Error Notice & Off Days */}
      {showStatusBar && (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          {/* Error Notice (Only when active term has error) */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {hasConflict && conflictingTitles && (
              <div className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive sm:text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>
                  {t("batchModal.cardConflictNotice", {
                    title: conflictingTitles,
                  })}
                </span>
              </div>
            )}
            {hasImbalance && (
              <div className="flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive sm:text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <span>
                  {evenDetail && oddDetail
                    ? t("batchModal.cardImbalanceNotice", {
                        even: formatNumber(
                          evenDetail.completedSessions,
                          activeLocale
                        ),
                        odd: formatNumber(
                          oddDetail.completedSessions,
                          activeLocale
                        ),
                      })
                    : t("batchModal.sessionImbalanceWarning")}
                </span>
              </div>
            )}
          </div>

          {/* Off Days (Across from Error Notice) */}
          {holidaysCount > 0 && (
            <div className="ms-auto flex shrink-0 items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs font-semibold text-destructive sm:text-sm">
              <CalendarOff className="size-4 shrink-0 text-destructive" />
              <span>
                {t("batchModal.holidaysCountBadge", {
                  count: formatNumber(holidaysCount, activeLocale),
                })}
              </span>
            </div>
          )}
        </div>
      )}

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
        lockedTermIndex={lockedTermIndex}
        readOnly={readOnly}
        existingTerms={existingTerms}
      />
    </div>
  )
}
