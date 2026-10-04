"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { gregorianToJalali } from "@workspace/types"
import { institutesResource, termsResource, classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { OffDaysFilter } from "../off-days-filter"
import { HolidaysCalendar } from "./holidays-calendar"

export function OffDaysContent() {
  const locale = useLocale() as "fa" | "en"
  const { activeInstituteId } = useActiveInstitute()

  const today = React.useMemo(() => new Date(), [])
  const currentYear = React.useMemo(
    () =>
      locale === "fa" ? gregorianToJalali(today).year : today.getFullYear(),
    [locale, today]
  )

  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [viewMode, setViewMode] = React.useState<"year" | "month">("year")

  const { data: institute, isLoading: isLoadingInstitute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const { data: customOffDays = [] } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery({ instituteId: activeInstituteId! }),
    enabled: Boolean(activeInstituteId),
  })

  const { data: classes = [] } = useQuery({
    ...classesResource.list.toQuery({ instituteId: activeInstituteId! }),
    enabled: Boolean(activeInstituteId),
  })

  const customOffDaysDates = React.useMemo(
    () => customOffDays.map((offDay) => offDay.date),
    [customOffDays]
  )

  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  if (!activeInstituteId) return null

  return (
    <AdminPageShell
      filter={
        <OffDaysFilter
          selectedYear={selectedYear}
          currentYear={currentYear}
          onYearChange={setSelectedYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locale={locale}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <HolidaysCalendar
          instituteId={activeInstituteId}
          observeOfficialHolidays={observeOfficialHolidays}
          isLoadingInstitute={isLoadingInstitute}
          dismissedHolidays={institute?.dismissedHolidays}
          customOffDays={customOffDaysDates}
          customOffDaysList={customOffDays}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          terms={terms}
          classes={classes}
        />
      </div>
    </AdminPageShell>
  )
}
