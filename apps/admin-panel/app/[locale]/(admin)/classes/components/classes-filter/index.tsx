"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { termsResource, coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface ClassesFilterProps {
  termId: string
  onTermChange: (termId: string) => void
  courseId: string
  onCourseChange: (courseId: string) => void
  search: string
  onSearchChange: (search: string) => void
}

export function ClassesFilter({
  termId,
  onTermChange,
  courseId,
  onCourseChange,
  search,
  onSearchChange,
}: ClassesFilterProps) {
  const t = useTranslations("classes")
  const { activeInstituteId } = useActiveInstitute()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: termOptions = [{ value: "all", label: t("allTerms") }] } =
    useQuery({
      ...termsResource.list.toQuery(queryParams),
      enabled: !!activeInstituteId,
      select: (terms) => [
        { value: "all", label: t("allTerms") },
        ...terms.map((term) => ({ value: term.id, label: term.title })),
      ],
    })

  const { data: courseOptions = [{ value: "all", label: t("allCourses") }] } =
    useQuery({
      ...coursesResource.list.toQuery(queryParams),
      enabled: !!activeInstituteId,
      select: (courses) => [
        { value: "all", label: t("allCourses") },
        ...courses.map((course) => ({ value: course.id, label: course.title })),
      ],
    })

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <>
          <div className="w-full sm:w-48">
            <Combobox
              items={termOptions}
              value={termId || "all"}
              onValueChange={(val) =>
                onTermChange(val === "all" || !val ? "" : val)
              }
              placeholder={t("termFilter")}
              clearable={false}
            />
          </div>

          <div className="w-full sm:w-48">
            <Combobox
              items={courseOptions}
              value={courseId || "all"}
              onValueChange={(val) =>
                onCourseChange(val === "all" || !val ? "" : val)
              }
              placeholder={t("courseFilter")}
              clearable={false}
            />
          </div>
        </>
      }
    />
  )
}
