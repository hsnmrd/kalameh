"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Info } from "lucide-react"
import { Calendar } from "@workspace/ui/components/calendar"
import type {
  GeneratedTermProposal,
  CompensatorySession,
} from "@workspace/types"
import {
  buildTermCalendarModifiers,
  getTermColorTheme,
} from "../helper/calendar-colors"
import { CalendarLegend } from "../calendar-legend"
import { DayActionsPopover } from "./day-actions-popover"
import { CompensatorySessionModal } from "../../compensatory-session-modal"

export interface CalendarGridProps {
  proposals: GeneratedTermProposal[]
  selectedTermIndex: number
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

export function CalendarGrid({
  proposals,
  selectedTermIndex,
  onStartDateChange,
  onToggleHoliday,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale = "fa",
  observeOfficialHolidays = true,
  customOffDays = [],
  activeDismissedHolidays = [],
  compensatorySessions = {},
}: CalendarGridProps) {
  const t = useTranslations("terms")

  const selectedTerm = proposals[selectedTermIndex]
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
    return buildTermCalendarModifiers(proposals, isRtl, {
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays: activeDismissedHolidays,
      compensatorySessions,
    })
  }, [
    proposals,
    isRtl,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
  ])

  const handleDayClick = (
    date: Date,
    _modifiers: unknown,
    e: React.MouseEvent
  ) => {
    setSelectedDay(date)
    setAnchorEl((e.currentTarget as HTMLElement) || null)
    setPopoverOpen(true)
  }

  const handleOpenCompensatoryModal = (termIndex: number, dateYmd: string) => {
    setCompensatoryTermIndex(termIndex)
    setCompensatoryTargetDate(dateYmd)
    setCompensatoryModalOpen(true)
  }

  const hasDismissed = activeDismissedHolidays.length > 0
  const hasCompensatory = Object.values(compensatorySessions).some(
    (l) => l && l.length > 0
  )

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      {/* Centered Calendar Card */}
      <div className="flex w-full justify-center overflow-x-auto p-1">
        <Calendar
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="mx-auto w-fit border border-border bg-card shadow-xs"
          classNames={{
            month_grid:
              "w-full border-separate border-spacing-y-1.5 border-spacing-x-0.5",
            weekdays: "grid grid-cols-7 w-full justify-items-center mb-1",
            week: "grid grid-cols-7 w-full my-0.5 justify-items-stretch",
            day: "relative p-0 flex items-center justify-center aspect-square min-h-[44px] sm:min-h-[48px] w-full text-center text-sm sm:text-base focus-within:relative focus-within:z-20 overflow-hidden",
            day_button:
              "size-full aspect-square min-h-[44px] sm:min-h-[48px] p-0 text-sm sm:text-base font-semibold transition-colors select-none flex items-center justify-center rounded-none hover:bg-muted/40 active:scale-95 focus-visible:outline-hidden",
            selected:
              "!bg-transparent !text-inherit !shadow-none !rounded-none hover:!bg-transparent hover:!text-inherit",
            range_start: "!bg-transparent",
            range_end: "!bg-transparent",
            range_middle: "!bg-transparent",
          }}
        />
      </div>

      {/* Tips text (placed under the calendar) */}
      {selectedTerm && (
        <div className="flex w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/25 px-4 py-2 text-center text-xs text-muted-foreground sm:max-w-xl">
          <Info className="size-3.5 shrink-0 text-muted-foreground" />
          <span>
            {t("batchModal.selectStartPrompt", { title: selectedTerm.title })}
          </span>
        </div>
      )}

      {/* Off-days & Session Legend */}
      <CalendarLegend
        accentColor={selectedTheme?.accentColor}
        locale={locale}
        observeOfficialHolidays={observeOfficialHolidays}
        hasCustomOffDays={customOffDays.length > 0}
        hasDismissedHolidays={hasDismissed}
        hasCompensatorySessions={hasCompensatory}
      />

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
        onOpenCompensatoryModal={handleOpenCompensatoryModal}
        onRemoveCompensatorySession={onRemoveCompensatorySession ?? (() => {})}
        locale={locale}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        activeDismissedHolidays={activeDismissedHolidays}
        compensatorySessions={compensatorySessions}
      />

      {/* Compensatory Session Creation Modal */}
      <CompensatorySessionModal
        open={compensatoryModalOpen}
        onOpenChange={setCompensatoryModalOpen}
        targetDate={compensatoryTargetDate}
        termIndex={compensatoryTermIndex}
        termProposal={proposals[compensatoryTermIndex]}
        onSave={(termIdx, session) => {
          onAddCompensatorySession?.(termIdx, session)
        }}
        locale={locale}
      />
    </div>
  )
}
