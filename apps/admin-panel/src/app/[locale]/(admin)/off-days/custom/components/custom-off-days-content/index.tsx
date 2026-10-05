"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { FABSingle } from "@workspace/ui/components/fab"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useModal } from "@/lib/hooks"
import { ModalGateway } from "@/components/modal-gateway"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { formatDisplayDate } from "../../helper"
import { CustomOffDaysFilter } from "../custom-off-days-filter"
import { CustomOffDaysTable } from "../custom-off-days-table"
import { CustomOffDaysList } from "../custom-off-days-list"

import { modalRegistry } from "../../modal"

export function CustomOffDaysContent() {
  const t = useTranslations("setting.offDays")
  const locale = useLocale()
  const { activeInstituteId } = useActiveInstitute()
  const [search, setSearch] = React.useState("")
  const { openModal, closeModal } = useModal()

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
            { label: t("backToCalendar"), href: "/off-days" },
            { label: t("customOffDaysTitle") },
          ]}
        />
      }
      filter={
        <CustomOffDaysFilter
          search={search}
          onSearchChange={setSearch}
          onAddClick={() => openModal("addOffDay")}
        />
      }
      modals={
        <ModalGateway
          registry={modalRegistry}
          extraProps={{
            instituteId: activeInstituteId,
            observeOfficialHolidays: institute?.observeOfficialHolidays ?? true,
            existingOffDays: customOffDays.map((offDay) => offDay.date),
          }}
          onClose={closeModal}
        />
      }
      fab={
        <FABSingle
          onClick={() => openModal("addOffDay")}
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
          onDelete={(item) => openModal("deleteOffDay", { offDay: item })}
        />
      </div>

      {/* Mobile: MobileList */}
      <div className="lg:hidden">
        <CustomOffDaysList
          customOffDays={filteredOffDays}
          isLoading={isLoading}
          onDelete={(item) => openModal("deleteOffDay", { offDay: item })}
        />
      </div>
    </AdminPageShell>
  )
}
