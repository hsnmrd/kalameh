"use client"

import * as React from "react"
import {
  gregorianToJalali,
  jalaliToGregorian,
  type InstituteCustomOffDay,
} from "@workspace/types"

interface Options {
  instituteId: string
  observeOfficialHolidays: boolean
  dismissedHolidays: string[]
  customOffDaysList: InstituteCustomOffDay[]
  locale: "fa" | "en"
  selectedYear?: number
  onYearChange?: (year: number) => void
  viewMode?: "year" | "month"
  onViewModeChange?: (mode: "year" | "month") => void
}

export function useHolidaysCalendar(options: Options) {
  const today = React.useMemo(() => new Date(), [])
  const currentYear = React.useMemo(
    () =>
      options.locale === "fa"
        ? gregorianToJalali(today).year
        : today.getFullYear(),
    [options.locale, today]
  )
  const [internalYear, setInternalYear] = React.useState(currentYear)
  const [internalViewMode, setInternalViewMode] = React.useState<
    "year" | "month"
  >("year")
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date())

  // View-Only Day Details inspection
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedDateForDetails, setSelectedDateForDetails] =
    React.useState<Date | null>(null)

  const handleDayClick = (date: Date) => {
    setSelectedDateForDetails(date)
    setDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
    setSelectedDateForDetails(null)
  }

  const handleYearChange = (year: number) => {
    if (options.onYearChange) options.onYearChange(year)
    else setInternalYear(year)
    if (options.locale === "fa") {
      setCurrentMonth(
        jalaliToGregorian(year, gregorianToJalali(currentMonth).month, 1)
      )
    } else setCurrentMonth(new Date(year, currentMonth.getMonth(), 1))
  }

  const handleViewModeChange = (mode: "year" | "month") => {
    if (options.onViewModeChange) options.onViewModeChange(mode)
    else setInternalViewMode(mode)
  }

  return {
    selectedYear: options.selectedYear ?? internalYear,
    viewMode: options.viewMode ?? internalViewMode,
    currentYear,
    currentMonth,
    setCurrentMonth,
    stagedDismissed: options.dismissedHolidays,
    hasChanges: false,
    pendingChanges: [] as Array<{ date: string; willBeOpen: boolean }>,
    isSaving: false,
    handleDayClick,
    handleYearChange,
    handleViewModeChange,
    discard: () => {},
    save: () => {},
    undo: () => {},
    detailsModalOpen,
    selectedDateForDetails,
    closeDetailsModal,
    addModalOpen: false,
    selectedDateForAdd: undefined,
    closeAddModal: () => {},
    deleteModalOpen: false,
    selectedOffDayForDelete: null,
    closeDeleteModal: () => {},
  }
}
