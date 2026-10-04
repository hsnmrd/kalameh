"use client"

import * as React from "react"
import { Calendar } from "@workspace/ui/components/calendar"
import type { TermDto, ClassDto } from "@workspace/types"
import { AnnualCalendar } from "../annual-calendar"
import { isDateInAnyTerm, isDateClassSession } from "../../../../helper"

interface CalendarViewProps {
  viewMode: "year" | "month"
  selectedYear: number
  locale: "fa" | "en"
  currentMonth: Date
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays?: string[]
  onMonthChange: (month: Date) => void
  onDayClick: (date: Date) => void
  terms?: TermDto[]
  classes?: ClassDto[]
}

export function CalendarView({
  viewMode,
  selectedYear,
  locale,
  currentMonth,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays = [],
  onMonthChange,
  onDayClick,
  terms = [],
  classes = [],
}: CalendarViewProps) {
  const isTermDate = React.useCallback(
    (date: Date) => isDateInAnyTerm(date, terms),
    [terms]
  )

  const isSessionDate = React.useCallback(
    (date: Date) => isDateClassSession(date, classes),
    [classes]
  )

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
      modifiers={{
        termRange: isTermDate,
        sessionDay: isSessionDate,
      }}
      modifiersClassNames={{
        termRange: "[&>button]:bg-primary/[0.06] [&>button]:font-medium",
        sessionDay:
          "[&>button]:ring-1 [&>button]:ring-primary/40 [&>button]:bg-primary/15 font-semibold",
      }}
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
            terms={terms}
            classes={classes}
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
