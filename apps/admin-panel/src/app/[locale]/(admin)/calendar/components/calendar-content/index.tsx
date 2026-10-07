"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { CalendarOff } from "lucide-react"
import { FABSingle } from "@workspace/ui/components/fab"
import { gregorianToJalali } from "@workspace/types"
import { institutesResource, termsResource, classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { AdminPageShell } from "@/components/admin-page-shell"
import { CalendarFilter } from "../calendar-filter"
import { HolidaysCalendar } from "./holidays-calendar"

export function CalendarContent() {
  const locale = useLocale() as "fa" | "en"
  const t = useTranslations("setting.offDays")
  const router = useRouter()
  const { activeInstituteId } = useActiveInstitute()

  const today = React.useMemo(() => new Date(), [])
  const currentYear = React.useMemo(
    () =>
      locale === "fa" ? gregorianToJalali(today).year : today.getFullYear(),
    [locale, today]
  )

  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [viewMode, setViewMode] = React.useState<"year" | "month">("year")
  const [search, setSearch] = React.useState<string>("")
  const [selectedTermId, setSelectedTermId] = React.useState<string>("ALL")

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

  const filteredTerms = React.useMemo(() => {
    let result = terms
    if (selectedTermId !== "ALL") {
      result = result.filter((term) => term.id === selectedTermId)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((term) => term.title.toLowerCase().includes(q))
    }
    return result
  }, [terms, selectedTermId, search])

  const filteredClasses = React.useMemo(() => {
    let result = classes
    if (selectedTermId !== "ALL") {
      result = result.filter((cls) => cls.termId === selectedTermId)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((cls) => cls.title.toLowerCase().includes(q))
    }
    return result
  }, [classes, selectedTermId, search])

  const filteredCustomOffDays = React.useMemo(() => {
    if (!search.trim()) return customOffDays
    const q = search.trim().toLowerCase()
    return customOffDays.filter(
      (offDay) =>
        offDay.title.toLowerCase().includes(q) ||
        offDay.date.toLowerCase().includes(q)
    )
  }, [customOffDays, search])

  const customOffDaysDates = React.useMemo(
    () => filteredCustomOffDays.map((offDay) => offDay.date),
    [filteredCustomOffDays]
  )

  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  if (!activeInstituteId) return null

  return (
    <AdminPageShell
      filter={
        <CalendarFilter
          search={search}
          onSearchChange={setSearch}
          selectedYear={selectedYear}
          currentYear={currentYear}
          onYearChange={setSelectedYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedTermId={selectedTermId}
          onTermChange={setSelectedTermId}
          terms={terms}
          locale={locale}
        />
      }
      fab={
        <FABSingle
          onClick={() => router.push("/calendar/custom")}
          aria-label={t("manageCustomOffDays")}
        >
          <CalendarOff className="size-6" />
        </FABSingle>
      }
    >
      <div className="flex flex-col gap-6">
        <HolidaysCalendar
          instituteId={activeInstituteId}
          observeOfficialHolidays={observeOfficialHolidays}
          isLoadingInstitute={isLoadingInstitute}
          dismissedHolidays={institute?.dismissedHolidays}
          customOffDays={customOffDaysDates}
          customOffDaysList={filteredCustomOffDays}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          terms={filteredTerms}
          classes={filteredClasses}
        />
      </div>
    </AdminPageShell>
  )
}

export const OffDaysContent = CalendarContent
