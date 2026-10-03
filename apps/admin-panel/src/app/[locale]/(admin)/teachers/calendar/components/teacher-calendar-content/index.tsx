"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { CalendarX } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { classesResource, teachersResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { TeacherAvailabilityCalendar } from "@/components/teacher-availability-calendar"
import { buildTeacherCalendars } from "../../helper/build-teacher-calendars"
import { TeacherCalendarFilter } from "../teacher-calendar-filter"

export function TeacherCalendarContent() {
  const tTeachers = useTranslations("teachers")
  const tScheduling = useTranslations("scheduling.planDetails")
  const { activeInstituteId } = useActiveInstitute()

  const [searchValue, setSearchValue] = React.useState("")
  const [selectedTermId, setSelectedTermId] = React.useState("ALL")

  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    ...teachersResource.list.toQuery(
      activeInstituteId
        ? {
            instituteId: activeInstituteId,
            isActive: true,
          }
        : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    ...classesResource.list.toQuery(
      activeInstituteId
        ? {
            instituteId: activeInstituteId,
            termId: selectedTermId !== "ALL" ? selectedTermId : undefined,
          }
        : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const filteredTeachers = React.useMemo(() => {
    if (!searchValue.trim()) return teachers
    const q = searchValue.trim().toLowerCase()
    return teachers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(q) ||
        t.lastName.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.nationalCode && t.nationalCode.includes(q))
    )
  }, [teachers, searchValue])

  const calendars = React.useMemo(() => {
    return buildTeacherCalendars(filteredTeachers, classes)
  }, [filteredTeachers, classes])

  const isLoading = isLoadingTeachers || isLoadingClasses

  return (
    <AdminPageShell
      breadcrumb={
        <AdminBreadcrumb
          backHref="/teachers"
          backLabel={tTeachers("title")}
          items={[
            { label: tTeachers("title"), href: "/teachers" },
            { label: tTeachers("teachersCalendar") },
          ]}
        />
      }
      filter={
        <TeacherCalendarFilter
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedTermId={selectedTermId}
          onTermChange={setSelectedTermId}
        />
      }
    >
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : calendars.length === 0 ? (
        <Empty variant="compact" className="min-h-64 bg-muted/20">
          <EmptyMedia>
            <CalendarX aria-hidden />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{tScheduling("teacherCalendar.noTeachers")}</EmptyTitle>
            <EmptyDescription>
              {searchValue.trim()
                ? tScheduling("teacherCalendar.noTeacherMatch")
                : tTeachers("table.empty")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TeacherAvailabilityCalendar
          calendars={calendars}
          scope="ALL"
          stickyTop="page"
        />
      )}
    </AdminPageShell>
  )
}
