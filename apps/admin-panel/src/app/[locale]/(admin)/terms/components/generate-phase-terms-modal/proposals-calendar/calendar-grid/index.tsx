"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Info } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Calendar } from "@workspace/ui/components/calendar"
import { isJalaliHoliday, type GeneratedTermProposal } from "@workspace/types"
import {
  buildTermCalendarModifiers,
  normalizeDateToYmd,
  getTermColorTheme,
} from "../helper/calendar-colors"
import { CalendarLegend } from "../calendar-legend"

export interface CalendarGridProps {
  proposals: GeneratedTermProposal[]
  selectedTermIndex: number
  onStartDateChange: (index: number, newStartDate: string) => void
  locale?: "fa" | "en"
}

export function CalendarGrid({
  proposals,
  selectedTermIndex,
  onStartDateChange,
  locale = "fa",
}: CalendarGridProps) {
  const t = useTranslations("terms")

  const selectedTerm = proposals[selectedTermIndex]
  const selectedTheme = selectedTerm
    ? getTermColorTheme(selectedTermIndex)
    : null

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
    return buildTermCalendarModifiers(proposals, isRtl)
  }, [proposals, isRtl])

  // Cache the initial start date of the first term so Term 1 cannot be picked earlier than initial start
  const initialStartRef = React.useRef<string | null>(null)
  if (!initialStartRef.current && proposals[0]?.startDate) {
    initialStartRef.current = normalizeDateToYmd(proposals[0].startDate)
  }

  const isDateDisabled = React.useCallback(
    (date: Date): boolean => {
      if (!selectedTerm) return false
      const ymd = normalizeDateToYmd(date)

      // 1. Cannot choose any date on or before previous term's end date
      if (selectedTermIndex > 0) {
        const prevTerm = proposals[selectedTermIndex - 1]
        if (prevTerm) {
          const prevEndYmd = normalizeDateToYmd(prevTerm.endDate)
          if (ymd <= prevEndYmd) return true
        }
      } else if (selectedTermIndex === 0 && initialStartRef.current) {
        // First term cannot be shifted before its initial start date
        if (ymd < initialStartRef.current) return true
      }

      // 2. Cannot start a term on Friday (weekend)
      const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
      if (isFriday) return true

      // 3. Cannot start a term on an official Jalali holiday
      if (isJalaliHoliday(date).isHoliday) return true

      return false
    },
    [selectedTerm, selectedTermIndex, proposals, isRtl]
  )

  const handleDayClick = (date: Date) => {
    if (!selectedTerm) return

    if (isDateDisabled(date)) {
      const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
      if (isFriday || isJalaliHoliday(date).isHoliday) {
        toast.error(t("batchModal.holidayStartDateWarning"))
      } else {
        toast.error(t("batchModal.minDateWarning"))
      }
      return
    }

    const clickedYmd = normalizeDateToYmd(date)
    onStartDateChange(selectedTermIndex, clickedYmd)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      {/* Centered Calendar Card */}
      <div className="flex w-full justify-center overflow-x-auto p-1">
        <Calendar
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          disabled={isDateDisabled}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="mx-auto w-fit border border-border bg-card shadow-xs"

          classNames={{
            month_grid:
              "w-full border-separate border-spacing-y-1 border-spacing-x-0",
            weekdays: "grid grid-cols-7 w-full justify-items-center mb-1",
            week: "grid grid-cols-7 w-full my-0.5 justify-items-stretch",
            day: "relative p-0 flex items-center justify-center h-9 w-full text-center text-sm focus-within:relative focus-within:z-20 overflow-hidden",
            day_button:
              "size-full h-9 p-0 text-sm font-medium transition-colors select-none flex items-center justify-center rounded-none hover:bg-muted/40 active:scale-95 focus-visible:outline-hidden",
            selected:
              "!bg-transparent !text-inherit !shadow-none !rounded-none hover:!bg-transparent hover:!text-inherit",
            range_start: "!bg-transparent",
            range_end: "!bg-transparent",
            range_middle: "!bg-transparent",
            disabled:
              "opacity-40 cursor-not-allowed pointer-events-none [&>button]:!cursor-not-allowed [&>button]:pointer-events-none [&>button]:hover:!bg-transparent",
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
      />
    </div>
  )
}
