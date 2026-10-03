"use client"

import * as React from "react"
import { jalaliToGregorian, gregorianToJalali } from "@workspace/types"
import { MonthCard } from "./month-card"

export interface AnnualCalendarProps {
  selectedYear: number
  locale: "fa" | "en"
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  onDayClick: (date: Date) => void
}

export function AnnualCalendar({
  selectedYear,
  locale,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  onDayClick,
}: AnnualCalendarProps) {
  const months = React.useMemo(() => {
    const today = new Date()
    const result: Array<{ key: string; date: Date; isCurrent: boolean }> = []

    if (locale === "fa") {
      const { year: currentYear, month: currentMonth } =
        gregorianToJalali(today)
      for (let m = 1; m <= 12; m++) {
        // Noon (12:00:00) avoids any timezone shift ambiguity
        const date = jalaliToGregorian(selectedYear, m, 1)
        const isCurrent = selectedYear === currentYear && m === currentMonth
        result.push({
          key: `jalali-${selectedYear}-${m}`,
          date,
          isCurrent,
        })
      }
    } else {
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      for (let m = 0; m < 12; m++) {
        const date = new Date(selectedYear, m, 1, 12, 0, 0, 0)
        const isCurrent = selectedYear === currentYear && m === currentMonth
        result.push({
          key: `gregorian-${selectedYear}-${m}`,
          date,
          isCurrent,
        })
      }
    }

    return result
  }, [selectedYear, locale])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => (
        <MonthCard
          key={month.key}
          monthDate={month.date}
          locale={locale}
          observeOfficialHolidays={observeOfficialHolidays}
          customOffDays={customOffDays}
          dismissedHolidays={dismissedHolidays}
          onDayClick={onDayClick}
          isCurrentMonth={month.isCurrent}
        />
      ))}
    </div>
  )
}
