"use client"

import * as React from "react"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  type GeneratedTermProposal,
  type CompensatorySession,
} from "@workspace/types"
import {
  buildTermCalendarModifiers,
  getTermColorTheme,
  normalizeDateToYmd,
} from "../helper/calendar-colors"
import { CalendarLegend } from "../calendar-legend"
import { DayActionsPopover } from "./day-actions-popover"
import { CompensatorySessionModal } from "../../compensatory-session-modal"
import { CalendarSurface } from "./calendar-surface"
import { TermHolidays } from "./term-holidays"
import { useCalendarGridMetadata } from "./hooks/use-calendar-grid-metadata"

export interface CalendarGridProps {
  proposals: GeneratedTermProposal[]
  selectedTermIndex: number
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
}

export function CalendarGrid({
  proposals,
  selectedTermIndex,
  onStartDateChange = () => {},
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale = "fa",
  observeOfficialHolidays = true,
  customOffDays = [],
  activeDismissedHolidays = [],
  compensatorySessions = {},
  numberOfMonths,
  lockedTermIndex,
  readOnly = false,
}: CalendarGridProps) {
  const isMobile = useIsMobile()
  const effectiveNumberOfMonths = numberOfMonths ?? (isMobile ? 1 : 2)

  const metadata = useCalendarGridMetadata(
    proposals,
    selectedTermIndex,
    locale,
    observeOfficialHolidays,
    activeDismissedHolidays
  )
  const selectedTerm = metadata.selectedTerm
  const selectedTheme = selectedTerm
    ? getTermColorTheme(selectedTermIndex)
    : null

  // Popover state
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  // Compensatory modal state
  const [compensatoryModalOpen, setCompensatoryModalOpen] =
    React.useState(false)
  const [compensatoryTargetDate, setCompensatoryTargetDate] =
    React.useState<string>("")
  const [compensatoryTermIndex, setCompensatoryTermIndex] =
    React.useState<number>(selectedTermIndex)
  const [compensatoryDefaultTrack, setCompensatoryDefaultTrack] =
    React.useState<"ODD" | "EVEN" | undefined>(undefined)

  // Track previous term index to jump calendar month without useEffect
  const [prevTermIndex, setPrevTermIndex] =
    React.useState<number>(selectedTermIndex)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    const initialIso = selectedTerm?.startDate || proposals[0]?.startDate
    return initialIso ? new Date(initialIso) : new Date()
  })

  if (prevTermIndex !== selectedTermIndex) {
    setPrevTermIndex(selectedTermIndex)
    if (selectedTerm?.startDate) {
      setCurrentMonth(new Date(selectedTerm.startDate))
    }
  }

  const isRtl = locale === "fa"

  const { modifiers, modifiersClassNames } = React.useMemo(() => {
    const base = buildTermCalendarModifiers(proposals, isRtl, {
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays: activeDismissedHolidays,
      compensatorySessions,
      selectedTermIndex,
    })

    if (popoverOpen && selectedDay) {
      const selectedYmd = normalizeDateToYmd(selectedDay)
      base.modifiers.activePopoverDay = (d: Date) =>
        normalizeDateToYmd(d) === selectedYmd
      base.modifiersClassNames.activePopoverDay =
        "[&>button]:ring-2 [&>button]:ring-primary [&>button]:ring-offset-2 [&>button]:ring-offset-background [&>button]:z-20"
    }

    // Disable today highlight entirely (no border or border-radius on current day)
    base.modifiers.today = () => false

    return base
  }, [
    proposals,
    isRtl,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
    selectedTermIndex,
    popoverOpen,
    selectedDay,
  ])

  const handleDayClick = (
    date: Date,
    _modifiers: unknown,
    e: React.MouseEvent
  ) => {
    setSelectedDay(date)
    const targetEl =
      (e.currentTarget as HTMLElement) ||
      ((e.target as HTMLElement)?.closest("button") as HTMLElement | null)
    setAnchorEl(targetEl)
    setPopoverOpen(true)
  }

  const handleOpenCompensatoryModal = (
    termIndex: number,
    dateYmd: string,
    defaultTrack?: "ODD" | "EVEN"
  ) => {
    setCompensatoryTermIndex(termIndex)
    setCompensatoryTargetDate(dateYmd)
    setCompensatoryDefaultTrack(defaultTrack)
    setCompensatoryModalOpen(true)
  }

  const hasDismissed = activeDismissedHolidays.length > 0
  const activeTermCompensatories =
    selectedTermIndex !== undefined
      ? (compensatorySessions[selectedTermIndex] ?? [])
      : Object.values(compensatorySessions).flat()
  const hasCompensatory = activeTermCompensatories.length > 0

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      <CalendarSurface
        locale={locale}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        onDayClick={handleDayClick}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        dismissedHolidays={activeDismissedHolidays}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        numberOfMonths={effectiveNumberOfMonths}
      />

      {/* Off-days & Session Legend */}
      <CalendarLegend
        accentColor={selectedTheme?.accentColor}
        evenColorHex={selectedTheme?.evenColorHex}
        oddColorHex={selectedTheme?.oddColorHex}
        locale={locale}
        observeOfficialHolidays={observeOfficialHolidays}
        hasCustomOffDays={customOffDays.length > 0}
        hasDismissedHolidays={hasDismissed}
        hasCompensatorySessions={hasCompensatory}
        hasExcessSessions={metadata.hasExcess}
      />

      {/* Active Term Holidays List (Plain text) */}
      {selectedTerm && (
        <TermHolidays holidays={metadata.holidays} locale={locale} />
      )}

      {/* Contextual Day Actions Popover */}
      <DayActionsPopover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        anchorEl={anchorEl}
        date={selectedDay}
        termProposal={selectedTerm}
        selectedTermIndex={selectedTermIndex}
        proposals={proposals}
        onSetStartDate={onStartDateChange}
        onToggleHoliday={onToggleHoliday ?? (() => {})}
        onToggleCustomOffDay={onToggleCustomOffDay}
        onOpenCompensatoryModal={handleOpenCompensatoryModal}
        onRemoveCompensatorySession={onRemoveCompensatorySession ?? (() => {})}
        locale={locale}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        activeDismissedHolidays={activeDismissedHolidays}
        compensatorySessions={compensatorySessions}
        lockedTermIndex={lockedTermIndex}
        readOnly={readOnly}
      />

      {/* Compensatory Session Creation Modal */}
      <CompensatorySessionModal
        open={compensatoryModalOpen}
        onOpenChange={setCompensatoryModalOpen}
        targetDate={compensatoryTargetDate}
        termIndex={compensatoryTermIndex}
        termProposal={proposals[compensatoryTermIndex]}
        defaultTrack={compensatoryDefaultTrack}
        onSave={(termIdx, session) => {
          onAddCompensatorySession?.(termIdx, session)
        }}
        locale={locale}
      />
    </div>
  )
}
