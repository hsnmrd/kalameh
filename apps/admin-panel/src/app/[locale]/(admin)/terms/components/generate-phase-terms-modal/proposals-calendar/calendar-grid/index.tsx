"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calendar } from "@workspace/ui/components/calendar"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import {
  type GeneratedTermProposal,
  type CompensatorySession,
  getJalaliHolidaysInRange,
  parseJalaliString,
  jalaliToGregorian,
} from "@workspace/types"
import {
  buildTermCalendarModifiers,
  getTermColorTheme,
  normalizeDateToYmd,
} from "../helper/calendar-colors"
import { CalendarLegend } from "../calendar-legend"
import { DayActionsPopover } from "./day-actions-popover"
import { CompensatorySessionModal } from "../../compensatory-session-modal"

export interface CalendarGridProps {
  proposals: GeneratedTermProposal[]
  selectedTermIndex: number
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

export function CalendarGrid({
  proposals,
  selectedTermIndex,
  onStartDateChange,
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
}: CalendarGridProps) {
  const t = useTranslations("terms")
  const isMobile = useIsMobile()
  const effectiveNumberOfMonths = numberOfMonths ?? (isMobile ? 1 : 2)

  const selectedTerm = proposals[selectedTermIndex]
  const selectedTheme = selectedTerm
    ? getTermColorTheme(selectedTermIndex)
    : null

  const activeTermHolidays = React.useMemo(() => {
    if (!selectedTerm) return []
    if (
      selectedTerm.holidaysEncountered &&
      selectedTerm.holidaysEncountered.length > 0
    ) {
      return selectedTerm.holidaysEncountered.map((h) => ({
        dateYmd: h.date,
        dateJalali: h.dateJalali,
        title: locale === "fa" ? h.titleFa : h.titleEn,
        isDismissed: activeDismissedHolidays.includes(h.date),
      }))
    }
    if (
      observeOfficialHolidays &&
      selectedTerm.startDate &&
      selectedTerm.endDate
    ) {
      const holidays = getJalaliHolidaysInRange(
        selectedTerm.startDate,
        selectedTerm.endDate
      )
      return holidays.map((h) => {
        const parsed = parseJalaliString(h.date)
        const gDate = parsed
          ? jalaliToGregorian(parsed.year, parsed.month, parsed.day)
          : null
        const dateYmd = gDate ? normalizeDateToYmd(gDate) : h.date
        return {
          dateYmd,
          dateJalali: h.date.replace(/-/g, "/"),
          title: locale === "fa" ? h.titleFa : h.titleEn,
          isDismissed: activeDismissedHolidays.includes(dateYmd),
        }
      })
    }
    return []
  }, [selectedTerm, activeDismissedHolidays, observeOfficialHolidays, locale])

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

  const hasExcess = React.useMemo(() => {
    if (selectedTermIndex !== undefined && proposals[selectedTermIndex]) {
      return (proposals[selectedTermIndex].patternDetails ?? []).some(
        (pd) => pd.excessDates && pd.excessDates.length > 0
      )
    }
    return proposals.some((p) =>
      p.patternDetails?.some(
        (pd) => pd.excessDates && pd.excessDates.length > 0
      )
    )
  }, [proposals, selectedTermIndex])

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      {/* Centered Calendar Card */}
      <div className="flex w-full justify-center overflow-x-auto p-1 sm:overflow-visible">
        <Calendar
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          observeOfficialHolidays={observeOfficialHolidays}
          offDays={customOffDays}
          dismissedHolidays={activeDismissedHolidays}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          numberOfMonths={effectiveNumberOfMonths}
          showOutsideDays={effectiveNumberOfMonths === 1}
          className="w-full border border-border bg-card shadow-xs"
          classNames={{
            months:
              "relative flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-start w-full",
            month: "w-full",
            month_grid:
              "w-full border-separate border-spacing-y-1.5 border-spacing-x-0.5",
            weekdays: "grid grid-cols-7 w-full justify-items-center mb-1",
            week: "grid grid-cols-7 w-full my-0.5 justify-items-stretch",
            day: "relative p-0 flex items-center justify-center aspect-square min-h-[44px] sm:min-h-[48px] w-full text-center text-sm sm:text-base focus-within:relative focus-within:z-20 overflow-hidden",
            day_button:
              "size-full min-h-[44px] sm:min-h-[48px] p-0 text-sm sm:text-base font-semibold transition-colors select-none flex items-center justify-center rounded-none hover:bg-muted/40 active:scale-95 focus-visible:outline-hidden",
            selected:
              "!bg-transparent !text-inherit !shadow-none !rounded-none hover:!bg-transparent hover:!text-inherit",
            range_start: "!bg-transparent",
            range_end: "!bg-transparent",
            range_middle: "!bg-transparent",
            today: "!border-none !rounded-none !shadow-none font-inherit",
          }}
        />
      </div>

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
        hasExcessSessions={hasExcess}
      />

      {/* Active Term Holidays List (Plain text) */}
      {selectedTerm && activeTermHolidays.length > 0 && (
        <div
          dir={locale === "fa" ? "rtl" : "ltr"}
          className="flex w-full flex-wrap items-center justify-start gap-x-4 gap-y-1.5 px-1 text-start text-xs text-muted-foreground"
        >
          {activeTermHolidays.map((h) => (
            <span key={h.dateYmd} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  h.isDismissed ? "bg-emerald-600" : "bg-destructive"
                )}
              />
              <span className="font-medium text-foreground">
                {h.dateJalali}
              </span>
              <span>:</span>
              <span>{h.title}</span>
              {h.isDismissed && (
                <span className="text-[11px] font-medium text-emerald-600">
                  ({t("batchModal.statusDismissedBadge")})
                </span>
              )}
            </span>
          ))}
        </div>
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
