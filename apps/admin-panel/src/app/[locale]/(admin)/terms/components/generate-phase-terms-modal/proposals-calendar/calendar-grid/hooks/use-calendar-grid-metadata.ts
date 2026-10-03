"use client"

import * as React from "react"
import {
  getJalaliHolidaysInRange,
  jalaliToGregorian,
  parseJalaliString,
  type GeneratedTermProposal,
} from "@workspace/types"
import { normalizeDateToYmd } from "../../helper/calendar-colors"

export function useCalendarGridMetadata(
  proposals: GeneratedTermProposal[],
  selectedTermIndex: number,
  locale: "fa" | "en",
  observeOfficialHolidays: boolean,
  dismissedHolidays: string[]
) {
  const selectedTerm = proposals[selectedTermIndex]
  const holidays = React.useMemo(() => {
    if (!selectedTerm) return []
    if (selectedTerm.holidaysEncountered?.length) {
      return selectedTerm.holidaysEncountered.map((holiday) => ({
        dateYmd: holiday.date,
        dateJalali: holiday.dateJalali,
        title: locale === "fa" ? holiday.titleFa : holiday.titleEn,
        isDismissed: dismissedHolidays.includes(holiday.date),
      }))
    }
    if (
      !observeOfficialHolidays ||
      !selectedTerm.startDate ||
      !selectedTerm.endDate
    )
      return []
    return getJalaliHolidaysInRange(
      selectedTerm.startDate,
      selectedTerm.endDate
    ).map((holiday) => {
      const parsed = parseJalaliString(holiday.date)
      const gregorianDate = parsed
        ? jalaliToGregorian(parsed.year, parsed.month, parsed.day)
        : null
      const dateYmd = gregorianDate
        ? normalizeDateToYmd(gregorianDate)
        : holiday.date
      return {
        dateYmd,
        dateJalali: holiday.date.replace(/-/g, "/"),
        title: locale === "fa" ? holiday.titleFa : holiday.titleEn,
        isDismissed: dismissedHolidays.includes(dateYmd),
      }
    })
  }, [selectedTerm, dismissedHolidays, observeOfficialHolidays, locale])
  const hasExcess = React.useMemo(
    () =>
      (selectedTerm?.patternDetails ?? []).some((detail) =>
        Boolean(detail.excessDates?.length)
      ),
    [selectedTerm]
  )

  return { selectedTerm, holidays, hasExcess }
}
