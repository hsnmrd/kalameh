"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarOff } from "lucide-react"
import { FABSingle } from "@workspace/ui/components/fab"
import { toast } from "@workspace/ui/components/sonner"
import { gregorianToJalali } from "@workspace/types"
import { useRouter } from "@/i18n/routing"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { OffDaysFilter } from "../off-days-filter"
import { HolidaysCalendar } from "./holidays-calendar"

export function OffDaysContent() {
  const t = useTranslations("setting")
  const locale = useLocale() as "fa" | "en"
  const router = useRouter()
  const queryClient = useQueryClient()
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

  const customOffDaysDates = React.useMemo(
    () => customOffDays.map((offDay) => offDay.date),
    [customOffDays]
  )

  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("offDays.successUpdateSettings"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
    },
  })

  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  const handleToggleObserve = (checked: boolean) => {
    if (!activeInstituteId) return
    updateMutation.mutate({
      id: activeInstituteId,
      body: { observeOfficialHolidays: checked },
    })
  }

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
      fab={
        <FABSingle
          onClick={() => router.push("/off-days/custom")}
          aria-label={t("offDays.manageCustomOffDays")}
        >
          <CalendarOff className="size-6" />
        </FABSingle>
      }
    >
      <div className="flex flex-col gap-6">
        <HolidaysCalendar
          instituteId={activeInstituteId}
          observeOfficialHolidays={observeOfficialHolidays}
          onToggleObserve={handleToggleObserve}
          isUpdatingSettings={updateMutation.isPending}
          isLoadingInstitute={isLoadingInstitute}
          dismissedHolidays={institute?.dismissedHolidays}
          customOffDays={customOffDaysDates}
          customOffDaysList={customOffDays}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </AdminPageShell>
  )
}
