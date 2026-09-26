"use client"

import type * as React from "react"
import { Calendar } from "@workspace/ui/components/calendar"

interface CalendarSurfaceProps {
  locale: "fa" | "en"
  month: Date
  onMonthChange: (month: Date) => void
  onDayClick: (date: Date, modifiers: unknown, event: React.MouseEvent) => void
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
  numberOfMonths: number
}

export function CalendarSurface({
  locale,
  month,
  onMonthChange,
  onDayClick,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  modifiers,
  modifiersClassNames,
  numberOfMonths,
}: CalendarSurfaceProps) {
  return (
    <div className="flex w-full justify-center overflow-x-auto p-1 sm:overflow-visible">
      <Calendar
        locale={locale}
        month={month}
        onMonthChange={onMonthChange}
        onDayClick={onDayClick}
        observeOfficialHolidays={observeOfficialHolidays}
        offDays={customOffDays}
        dismissedHolidays={dismissedHolidays}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        numberOfMonths={numberOfMonths}
        showOutsideDays={numberOfMonths === 1}
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
  )
}
