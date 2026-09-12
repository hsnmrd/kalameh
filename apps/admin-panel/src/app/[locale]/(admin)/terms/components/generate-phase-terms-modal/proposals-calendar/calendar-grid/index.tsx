"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Info } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import { Calendar } from "@workspace/ui/components/calendar"
import type { GeneratedTermProposal } from "@workspace/types"
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

  const { modifiers, modifiersClassNames } = React.useMemo(() => {
    return buildTermCalendarModifiers(proposals)
  }, [proposals])

  const handleDayClick = (date: Date) => {
    if (!selectedTerm) return

    const clickedYmd = normalizeDateToYmd(date)

    // Check minimum allowed date (must be after previous term's end date)
    if (selectedTermIndex > 0) {
      const prevTerm = proposals[selectedTermIndex - 1]
      if (prevTerm) {
        const prevEndYmd = normalizeDateToYmd(prevTerm.endDate)
        if (clickedYmd <= prevEndYmd) {
          toast.error(t("batchModal.minDateWarning"))
          return
        }
      }
    }

    onStartDateChange(selectedTermIndex, clickedYmd)
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      {/* Centered Calendar Card */}
      <div className="flex w-full justify-center overflow-x-auto p-1">
        <Calendar
          mode="single"
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          showOffDays
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="mx-auto w-fit border border-border bg-card shadow-xs"
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
