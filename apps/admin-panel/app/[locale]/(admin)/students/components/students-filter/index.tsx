"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { CourseDto } from "@workspace/types"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import {
  AdminFilterTabs,
  type FilterTabOption,
} from "@/components/admin-filter-tabs"

export interface StudentsFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedCourseId: string
  onCourseChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  courses?: CourseDto[]
}

export function StudentsFilter({
  searchValue,
  onSearchChange,
  selectedCourseId,
  onCourseChange,
  selectedStatus,
  onStatusChange,
  courses = [],
}: StudentsFilterProps) {
  const t = useTranslations("students")

  const courseOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allCourses") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ]
  }, [courses, t])

  const statusTabs: FilterTabOption[] = React.useMemo(() => {
    return [
      { key: "ALL", label: t("filter.allStatus") },
      { key: "ACTIVE", label: t("filter.active") },
      { key: "INACTIVE", label: t("filter.inactive") },
    ]
  }, [t])

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <>
          {/* Course Combobox Filter */}
          <div className="w-full sm:w-52">
            <Combobox
              items={courseOptions}
              value={selectedCourseId}
              onValueChange={(val) => onCourseChange(val || "ALL")}
              placeholder={t("filter.allCourses")}
              clearable={false}
            />
          </div>

          {/* Status Segmented Tabs Filter */}
          <AdminFilterTabs
            options={statusTabs}
            value={selectedStatus}
            onChange={onStatusChange}
          />
        </>
      }
    />
  )
}
