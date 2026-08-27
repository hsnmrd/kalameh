"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { CourseDto } from "@workspace/types"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

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

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ACTIVE", label: t("filter.active") },
      { value: "INACTIVE", label: t("filter.inactive") },
    ]
  }, [t])

  const activeFiltersCount =
    (selectedCourseId !== "ALL" ? 1 : 0) + (selectedStatus !== "ALL" ? 1 : 0)

  const hasActiveFilter = Boolean(searchValue.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onCourseChange("ALL")
    onStatusChange("ALL")
  }, [onCourseChange, onStatusChange])

  return (
    <AdminFilterBar
      isPinned={hasActiveFilter}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
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
          <Field>
            <FieldLabel>{t("filter.course")}</FieldLabel>
            <ResponsiveCombobox
              items={courseOptions}
              value={selectedCourseId}
              onValueChange={(val) => onCourseChange(val || "ALL")}
              placeholder={t("filter.allCourses")}
              drawerTitle={t("filter.course")}
              clearable={false}
            />
          </Field>

          {/* Status Combobox Filter */}
          <Field>
            <FieldLabel>{t("filter.status")}</FieldLabel>
            <ResponsiveCombobox
              items={statusOptions}
              value={selectedStatus}
              onValueChange={(val) => onStatusChange(val || "ALL")}
              placeholder={t("filter.allStatus")}
              drawerTitle={t("filter.status")}
              clearable={false}
            />
          </Field>
        </>
      }
    />
  )
}
