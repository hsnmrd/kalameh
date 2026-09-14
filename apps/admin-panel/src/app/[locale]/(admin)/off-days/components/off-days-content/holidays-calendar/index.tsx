"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Calendar } from "@workspace/ui/components/calendar"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  isJalaliHoliday,
  gregorianToJalali,
  jalaliToGregorian,
  type InstituteCustomOffDay,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { CalendarMobileActions } from "./calendar-mobile-actions"
import { CalendarModals } from "./calendar-modals"
import { PendingHolidayChanges } from "./pending-holiday-changes"
import { CalendarToolbar } from "./calendar-toolbar"
import { AnnualCalendar } from "./annual-calendar"

export interface HolidaysCalendarProps {
  instituteId: string
  observeOfficialHolidays: boolean
  dismissedHolidays?: string[]
  customOffDays?: string[]
  customOffDaysList?: InstituteCustomOffDay[]
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function HolidaysCalendar({
  instituteId,
  observeOfficialHolidays,
  dismissedHolidays = [],
  customOffDays = [],
  customOffDaysList = [],
}: HolidaysCalendarProps) {
  const t = useTranslations("setting.offDays")
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()

  const today = React.useMemo(() => new Date(), [])
  const currentYear = React.useMemo(
    () =>
      locale === "fa" ? gregorianToJalali(today).year : today.getFullYear(),
    [locale, today]
  )

  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [viewMode, setViewMode] = React.useState<"year" | "month">("year")
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date())
  const [stagedDismissed, setStagedDismissed] = React.useState<Set<string>>(
    () => new Set(dismissedHolidays)
  )

  const [addModalOpen, setAddModalOpen] = React.useState(false)
  const [selectedDateForAdd, setSelectedDateForAdd] = React.useState<
    string | undefined
  >(undefined)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [selectedOffDayForDelete, setSelectedOffDayForDelete] =
    React.useState<InstituteCustomOffDay | null>(null)

  const initialSet = React.useMemo(
    () => new Set(dismissedHolidays),
    [dismissedHolidays]
  )

  const propKey = (dismissedHolidays || []).join(",")
  const [lastPropKey, setLastPropKey] = React.useState(propKey)
  if (lastPropKey !== propKey) {
    setLastPropKey(propKey)
    setStagedDismissed(new Set(dismissedHolidays))
  }

  const hasChanges = React.useMemo(() => {
    if (stagedDismissed.size !== initialSet.size) return true
    for (const d of stagedDismissed) {
      if (!initialSet.has(d)) return true
    }
    return false
  }, [stagedDismissed, initialSet])

  const pendingChanges = React.useMemo(() => {
    return Array.from(new Set([...initialSet, ...stagedDismissed]))
      .filter((date) => initialSet.has(date) !== stagedDismissed.has(date))
      .sort()
      .map((date) => ({ date, willBeOpen: stagedDismissed.has(date) }))
  }, [stagedDismissed, initialSet])

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
    const holidayCheck = isJalaliHoliday(date)

    if (observeOfficialHolidays && holidayCheck.isHoliday) {
      setStagedDismissed((prev) => {
        const next = new Set(prev)
        if (next.has(isoDate)) next.delete(isoDate)
        else next.add(isoDate)
        return next
      })
      return
    }

    const existingCustom = customOffDaysList.find(
      (item) => item.date === isoDate
    )
    if (existingCustom) {
      setSelectedOffDayForDelete(existingCustom)
      setDeleteModalOpen(true)
      return
    }

    setSelectedDateForAdd(isoDate)
    setAddModalOpen(true)
  }

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear)
    if (locale === "fa") {
      const currentJMonth = gregorianToJalali(currentMonth).month
      setCurrentMonth(jalaliToGregorian(newYear, currentJMonth, 1))
    } else {
      setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1))
    }
  }

  const handleSave = () => {
    if (!instituteId || !hasChanges) return
    updateMutation.mutate({
      id: instituteId,
      body: { dismissedHolidays: Array.from(stagedDismissed) },
    })
  }

  const handleDiscard = () => {
    setStagedDismissed(new Set(initialSet))
  }

  const handleUndoChange = (date: string) => {
    setStagedDismissed((previous) => {
      const next = new Set(previous)
      if (initialSet.has(date)) next.add(date)
      else next.delete(date)
      return next
    })
  }

  const stagedArray = React.useMemo(
    () => Array.from(stagedDismissed),
    [stagedDismissed]
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/80 bg-background/60 p-4",
        hasChanges && "pb-28 lg:pb-4"
      )}
    >
      <CalendarHeader
        hasChanges={hasChanges}
        pendingChangesCount={pendingChanges.length}
        isSaving={updateMutation.isPending}
        onDiscard={handleDiscard}
        onSave={handleSave}
      />

      <CalendarToolbar
        selectedYear={selectedYear}
        currentYear={currentYear}
        onYearChange={handleYearChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        locale={locale}
      />

      {hasChanges && (
        <PendingHolidayChanges
          changes={pendingChanges}
          locale={locale}
          onUndo={handleUndoChange}
        />
      )}

      <CalendarLegend />

      <div className="hidden lg:block">
        {viewMode === "year" ? (
          <AnnualCalendar
            selectedYear={selectedYear}
            locale={locale}
            observeOfficialHolidays={observeOfficialHolidays}
            customOffDays={customOffDays}
            dismissedHolidays={stagedArray}
            onDayClick={handleDayClick}
          />
        ) : (
          <div className="flex w-full justify-center p-1">
            <Calendar
              locale={locale}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={handleDayClick}
              showOffDays={true}
              observeOfficialHolidays={observeOfficialHolidays}
              offDays={customOffDays}
              dismissedHolidays={stagedArray}
              className="mx-auto w-fit border border-border bg-card shadow-xs"
            />
          </div>
        )}
      </div>

      <div className="flex w-full justify-center overflow-x-auto p-1 lg:hidden">
        <Calendar
          locale={locale}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          onDayClick={handleDayClick}
          showOffDays={true}
          observeOfficialHolidays={observeOfficialHolidays}
          offDays={customOffDays}
          dismissedHolidays={stagedArray}
          className="mx-auto w-fit border border-border bg-card shadow-xs"
        />
      </div>

      {hasChanges && (
        <CalendarMobileActions
          isPending={updateMutation.isPending}
          onReset={handleDiscard}
          onSave={handleSave}
        />
      )}

      <CalendarModals
        instituteId={instituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        existingOffDays={customOffDays}
        addModalOpen={addModalOpen}
        onAddModalClose={() => {
          setAddModalOpen(false)
          setSelectedDateForAdd(undefined)
        }}
        selectedDateForAdd={selectedDateForAdd}
        deleteModalOpen={deleteModalOpen}
        onDeleteModalClose={() => {
          setDeleteModalOpen(false)
          setSelectedOffDayForDelete(null)
        }}
        selectedOffDayForDelete={selectedOffDayForDelete}
      />
    </div>
  )
}
