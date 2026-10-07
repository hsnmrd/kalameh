"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"
import type { InstituteCustomOffDay, TermDto, ClassDto } from "@workspace/types"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarView } from "./calendar-view"
import { useHolidaysCalendar } from "./hooks/use-holidays-calendar"
import { DayDetailsModal } from "../../day-details-modal"

export interface HolidaysCalendarProps {
  instituteId: string
  observeOfficialHolidays: boolean
  onToggleObserve?: (checked: boolean) => void
  isUpdatingSettings?: boolean
  isLoadingInstitute?: boolean
  dismissedHolidays?: string[]
  customOffDays?: string[]
  customOffDaysList?: InstituteCustomOffDay[]
  selectedYear?: number
  onYearChange?: (year: number) => void
  viewMode?: "year" | "month"
  onViewModeChange?: (mode: "year" | "month") => void
  terms?: TermDto[]
  classes?: ClassDto[]
}

export function HolidaysCalendar({
  instituteId,
  observeOfficialHolidays,
  dismissedHolidays = [],
  customOffDays = [],
  customOffDaysList = [],
  selectedYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  terms = [],
  classes = [],
}: HolidaysCalendarProps) {
  const locale = useLocale() as "fa" | "en"
  const calendar = useHolidaysCalendar({
    instituteId,
    observeOfficialHolidays,
    dismissedHolidays,
    customOffDaysList,
    locale,
    selectedYear,
    onYearChange,
    viewMode,
    onViewModeChange,
  })
  const isControlled = selectedYear !== undefined

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/80 bg-background/60 p-4"
      )}
    >
      {!isControlled && (
        <>
          <CalendarHeader termsCount={terms.length} locale={locale} />
          <CalendarToolbar
            selectedYear={calendar.selectedYear}
            currentYear={calendar.currentYear}
            onYearChange={calendar.handleYearChange}
            viewMode={calendar.viewMode}
            onViewModeChange={calendar.handleViewModeChange}
            locale={locale}
          />
        </>
      )}
      <CalendarLegend />
      <CalendarView
        viewMode={calendar.viewMode}
        selectedYear={calendar.selectedYear}
        locale={locale}
        currentMonth={calendar.currentMonth}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        dismissedHolidays={dismissedHolidays}
        onMonthChange={calendar.setCurrentMonth}
        onDayClick={calendar.handleDayClick}
        terms={terms}
        classes={classes}
      />

      {/* View-Only Day Details Inspection Modal */}
      <DayDetailsModal
        open={calendar.detailsModalOpen}
        onClose={calendar.closeDetailsModal}
        date={calendar.selectedDateForDetails}
        locale={locale}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDaysList={customOffDaysList}
        terms={terms}
        classes={classes}
      />
    </div>
  )
}
