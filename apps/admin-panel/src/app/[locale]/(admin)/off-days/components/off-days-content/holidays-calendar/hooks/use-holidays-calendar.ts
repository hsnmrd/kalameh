"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  gregorianToJalali,
  isJalaliHoliday,
  jalaliToGregorian,
  type InstituteCustomOffDay,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"

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

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function useHolidaysCalendar(options: Options) {
  const t = useTranslations("setting.offDays")
  const queryClient = useQueryClient()
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
  const [stagedDismissed, setStagedDismissed] = React.useState(
    () => new Set(options.dismissedHolidays)
  )
  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [selectedDateForAdd, setSelectedDateForAdd] = React.useState<string>()
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [selectedOffDayForDelete, setSelectedOffDayForDelete] =
    React.useState<InstituteCustomOffDay | null>(null)
  const initialSet = React.useMemo(
    () => new Set(options.dismissedHolidays),
    [options.dismissedHolidays]
  )
  const propKey = options.dismissedHolidays.join(",")
  const [lastPropKey, setLastPropKey] = React.useState(propKey)
  if (lastPropKey !== propKey) {
    setLastPropKey(propKey)
    setStagedDismissed(new Set(options.dismissedHolidays))
  }

  const hasChanges =
    stagedDismissed.size !== initialSet.size ||
    Array.from(stagedDismissed).some((date) => !initialSet.has(date))
  const pendingChanges = React.useMemo(
    () =>
      Array.from(new Set([...initialSet, ...stagedDismissed]))
        .filter((date) => initialSet.has(date) !== stagedDismissed.has(date))
        .sort()
        .map((date) => ({ date, willBeOpen: stagedDismissed.has(date) })),
    [initialSet, stagedDismissed]
  )
  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("successUpdateCalendar"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
    },
  })
  const handleDayClick = (date: Date) => {
    const isoDate = toIsoDate(date)
    if (options.observeOfficialHolidays && isJalaliHoliday(date).isHoliday) {
      setStagedDismissed((previous) => {
        const next = new Set(previous)
        if (next.has(isoDate)) next.delete(isoDate)
        else next.add(isoDate)
        return next
      })
      return
    }
    const customOffDay = options.customOffDaysList.find(
      (item) => item.date === isoDate
    )
    if (customOffDay) {
      setSelectedOffDayForDelete(customOffDay)
      setDeleteModalOpen(true)
    } else {
      setSelectedDateForAdd(isoDate)
      setAddModalOpen(true)
    }
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
  const discard = () => setStagedDismissed(new Set(initialSet))
  const save = () => {
    if (!options.instituteId || !hasChanges) return
    updateMutation.mutate({
      id: options.instituteId,
      body: { dismissedHolidays: Array.from(stagedDismissed) },
    })
  }
  const undo = (date: string) =>
    setStagedDismissed((previous) => {
      const next = new Set(previous)
      if (initialSet.has(date)) next.add(date)
      else next.delete(date)
      return next
    })

  return {
    selectedYear: options.selectedYear ?? internalYear,
    viewMode: options.viewMode ?? internalViewMode,
    currentYear,
    currentMonth,
    setCurrentMonth,
    stagedDismissed: Array.from(stagedDismissed),
    hasChanges,
    pendingChanges,
    isSaving: updateMutation.isPending,
    handleDayClick,
    handleYearChange,
    handleViewModeChange,
    discard,
    save,
    undo,
    addModalOpen,
    selectedDateForAdd,
    closeAddModal: () => {
      setAddModalOpen(false)
      setSelectedDateForAdd(undefined)
    },
    deleteModalOpen,
    selectedOffDayForDelete,
    closeDeleteModal: () => {
      setDeleteModalOpen(false)
      setSelectedOffDayForDelete(null)
    },
  }
}
