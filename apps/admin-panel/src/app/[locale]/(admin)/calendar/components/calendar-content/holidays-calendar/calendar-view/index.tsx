"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Calendar } from "@workspace/ui/components/calendar"
import type { TermDto, ClassDto } from "@workspace/types"
import { AnnualCalendar } from "../annual-calendar"
import {
  isDateClassSession,
  buildCalendarTermModifiers,
  getTermsRunningInMonth,
  getTermTheme,
  normalizeIsoDate,
} from "../../../../helper"

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
  const isSessionDate = React.useCallback(
    (date: Date) => isDateClassSession(date, classes),
    [classes]
  )

  const termsInCurrentMonth = React.useMemo(
    () => getTermsRunningInMonth(currentMonth, locale, terms),
    [currentMonth, locale, terms]
  )

  const termModifiers = React.useMemo(
    () => buildCalendarTermModifiers(termsInCurrentMonth, terms),
    [termsInCurrentMonth, terms]
  )

  const monthCalendar = (
    <div className="flex flex-col items-center gap-3">
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
          sessionDay: isSessionDate,
          ...termModifiers.modifiers,
        }}
        modifiersClassNames={{
          sessionDay:
            "[&>button]:ring-1.5 [&>button]:ring-foreground/50 font-semibold",
          ...termModifiers.modifiersClassNames,
        }}
        className="mx-auto w-fit border border-border bg-card shadow-xs"
      />

      {/* Clearly declare active terms in current month view */}
      {termsInCurrentMonth.length > 0 && (
        <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
          {termsInCurrentMonth.map((term) => {
            const theme = getTermTheme(term.id, terms)
            return (
              <Badge
                key={term.id}
                variant="outline"
                className={cn(
                  "gap-1.5 px-2 py-0.5 text-xs font-medium",
                  theme.badgeBg,
                  theme.badgeText,
                  theme.badgeBorder
                )}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full shadow-2xs",
                    theme.dotColor
                  )}
                />
                <span className="font-semibold">{term.title}</span>
                <span className="text-[10px] opacity-70">
                  ({normalizeIsoDate(term.startDate)} -{" "}
                  {normalizeIsoDate(term.endDate)})
                </span>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
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
