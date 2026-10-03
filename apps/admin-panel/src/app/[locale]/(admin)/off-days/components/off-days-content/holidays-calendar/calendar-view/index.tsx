"use client"

import { Calendar } from "@workspace/ui/components/calendar"
import { AnnualCalendar } from "../annual-calendar"

interface CalendarViewProps {
  viewMode: "year" | "month"
  selectedYear: number
  locale: "fa" | "en"
  currentMonth: Date
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  onMonthChange: (month: Date) => void
  onDayClick: (date: Date) => void
}

export function CalendarView({
  viewMode,
  selectedYear,
  locale,
  currentMonth,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  onMonthChange,
  onDayClick,
}: CalendarViewProps) {
  const monthCalendar = (
    <Calendar
      locale={locale}
      month={currentMonth}
      onMonthChange={onMonthChange}
      onDayClick={onDayClick}
      showOffDays
      observeOfficialHolidays={observeOfficialHolidays}
      offDays={customOffDays}
      dismissedHolidays={dismissedHolidays}
      className="mx-auto w-fit border border-border bg-card shadow-xs"
    />
  )

  return (
    <>
      <div className="hidden lg:block">
        {viewMode === "year" ? (
          <AnnualCalendar
            selectedYear={selectedYear}
            locale={locale}
            observeOfficialHolidays={observeOfficialHolidays}
            customOffDays={customOffDays}
            dismissedHolidays={dismissedHolidays}
            onDayClick={onDayClick}
          />
        ) : (
          <div className="flex w-full justify-center p-1">{monthCalendar}</div>
        )}
      </div>
      <div className="flex w-full justify-center overflow-x-auto p-1 lg:hidden">
        {monthCalendar}
      </div>
    </>
  )
}
