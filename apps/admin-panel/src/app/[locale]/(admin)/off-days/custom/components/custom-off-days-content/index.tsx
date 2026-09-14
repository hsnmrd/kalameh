"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import type { InstituteCustomOffDay } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { formatDisplayDate } from "../../helper"
import { CustomOffDaysFilter } from "../custom-off-days-filter"
import { CustomOffDaysTable } from "../custom-off-days-table"
import { CustomOffDaysList } from "../custom-off-days-list"
import { AddOffDayModal } from "./add-off-day-modal"
import { DeleteOffDayModal } from "./delete-off-day-modal"

export function CustomOffDaysContent() {
  const t = useTranslations("setting.offDays")
  const locale = useLocale()
  const { activeInstituteId } = useActiveInstitute()
  const [search, setSearch] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [deletingOffDay, setDeletingOffDay] =
    React.useState<InstituteCustomOffDay | null>(null)

  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const { data: customOffDays = [], isLoading } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const filteredOffDays = React.useMemo(() => {
    if (!search.trim()) return customOffDays
    const query = search.trim().toLowerCase()
    return customOffDays.filter((item) => {
      const displayDate = formatDisplayDate(item.date, locale).toLowerCase()
      return (
        item.title.toLowerCase().includes(query) ||
        item.date.toLowerCase().includes(query) ||
        displayDate.includes(query)
      )
    })
  }, [customOffDays, search, locale])

  if (!activeInstituteId) return null

  return (
    <AdminPageShell
      breadcrumb={
        <AdminBreadcrumb
          backHref="/off-days"
          backLabel={t("backToCalendar")}
          items={[
            { label: t("calendarTitle"), href: "/off-days" },
            { label: t("customOffDaysTitle") },
          ]}
        />
      }
      filter={
        <CustomOffDaysFilter
          search={search}
          onSearchChange={setSearch}
          onAddClick={() => setIsAddOpen(true)}
        />
      }
      modals={
        <>
          <AddOffDayModal
            open={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            instituteId={activeInstituteId}
            observeOfficialHolidays={institute?.observeOfficialHolidays ?? true}
            existingOffDays={customOffDays.map((offDay) => offDay.date)}
          />
          <DeleteOffDayModal
            open={Boolean(deletingOffDay)}
            onClose={() => setDeletingOffDay(null)}
            offDay={deletingOffDay}
            instituteId={activeInstituteId}
          />
        </>
      }
      fab={
        <FABSingle
          onClick={() => setIsAddOpen(true)}
          aria-label={t("addOffDay")}
        >
          <Plus className="size-6" />
        </FABSingle>
      }
    >
      {/* Desktop: DataTable */}
      <div className="hidden lg:block">
        <CustomOffDaysTable
          customOffDays={filteredOffDays}
          isLoading={isLoading}
          onDelete={(item) => setDeletingOffDay(item)}
        />
      </div>

      {/* Mobile: MobileList */}
      <div className="lg:hidden">
        <CustomOffDaysList
          customOffDays={filteredOffDays}
          isLoading={isLoading}
          onDelete={(item) => setDeletingOffDay(item)}
        />
      </div>
    </AdminPageShell>
  )
}
