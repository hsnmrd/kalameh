"use client"

import { useLocale } from "next-intl"
import { cn } from "@workspace/ui/lib/utils"
import type { InstituteCustomOffDay } from "@workspace/types"
import { ObserveHolidaysStickyBar } from "../observe-holidays-sticky-bar"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { CalendarMobileActions } from "./calendar-mobile-actions"
import { CalendarModals } from "./calendar-modals"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarView } from "./calendar-view"
import { useHolidaysCalendar } from "./hooks/use-holidays-calendar"
import { PendingHolidayChanges } from "./pending-holiday-changes"

export interface HolidaysCalendarProps {
  instituteId: string
  observeOfficialHolidays: boolean
  onToggleObserve?: (checked: boolean) => void
  isUpdatingSettings?: boolean
  isLoadingInstitute?: boolean
  dismissedHolidays?: string[]
  customOffDays?: string[]
  customOffDaysList?: InstituteCustomOffDay[]
  selectedYear?: number
  onYearChange?: (year: number) => void
  viewMode?: "year" | "month"
  onViewModeChange?: (mode: "year" | "month") => void
}

export function HolidaysCalendar({
  instituteId,
  observeOfficialHolidays,
  onToggleObserve,
  isUpdatingSettings = false,
  isLoadingInstitute = false,
  dismissedHolidays = [],
  customOffDays = [],
  customOffDaysList = [],
  selectedYear,
  onYearChange,
  viewMode,
  onViewModeChange,
}: HolidaysCalendarProps) {
  const locale = useLocale() as "fa" | "en"
  const calendar = useHolidaysCalendar({
    instituteId,
    observeOfficialHolidays,
    dismissedHolidays,
    customOffDaysList,
    locale,
    selectedYear,
    onYearChange,
    viewMode,
    onViewModeChange,
  })
  const isControlled = selectedYear !== undefined

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/80 bg-background/60 p-4",
        calendar.hasChanges && "pb-28 lg:pb-4"
      )}
    >
      {!isControlled && (
        <>
          <CalendarHeader
            hasChanges={calendar.hasChanges}
            pendingChangesCount={calendar.pendingChanges.length}
            isSaving={calendar.isSaving}
            onDiscard={calendar.discard}
            onSave={calendar.save}
          />
          <CalendarToolbar
            selectedYear={calendar.selectedYear}
            currentYear={calendar.currentYear}
            onYearChange={calendar.handleYearChange}
            viewMode={calendar.viewMode}
            onViewModeChange={calendar.handleViewModeChange}
            locale={locale}
          />
        </>
      )}
      {calendar.hasChanges && (
        <PendingHolidayChanges
          changes={calendar.pendingChanges}
          locale={locale}
          onUndo={calendar.undo}
        />
      )}
      <CalendarLegend />
      <CalendarView
        viewMode={calendar.viewMode}
        selectedYear={calendar.selectedYear}
        locale={locale}
        currentMonth={calendar.currentMonth}
        observeOfficialHolidays={observeOfficialHolidays}
        customOffDays={customOffDays}
        dismissedHolidays={calendar.stagedDismissed}
        onMonthChange={calendar.setCurrentMonth}
        onDayClick={calendar.handleDayClick}
      />
      {calendar.hasChanges && (
        <CalendarMobileActions
          isPending={calendar.isSaving}
          onReset={calendar.discard}
          onSave={calendar.save}
        />
      )}
      <CalendarModals
        instituteId={instituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        existingOffDays={customOffDays}
        addModalOpen={calendar.addModalOpen}
        onAddModalClose={calendar.closeAddModal}
        selectedDateForAdd={calendar.selectedDateForAdd}
        deleteModalOpen={calendar.deleteModalOpen}
        onDeleteModalClose={calendar.closeDeleteModal}
        selectedOffDayForDelete={calendar.selectedOffDayForDelete}
      />
      {onToggleObserve && (
        <ObserveHolidaysStickyBar
          observeOfficialHolidays={observeOfficialHolidays}
          onToggleObserve={onToggleObserve}
          isUpdatingSettings={isUpdatingSettings}
          isLoadingInstitute={isLoadingInstitute}
          hasChanges={calendar.hasChanges}
          pendingChangesCount={calendar.pendingChanges.length}
          isSavingCalendar={calendar.isSaving}
          onDiscardCalendar={calendar.discard}
          onSaveCalendar={calendar.save}
        />
      )}
    </div>
  )
}
