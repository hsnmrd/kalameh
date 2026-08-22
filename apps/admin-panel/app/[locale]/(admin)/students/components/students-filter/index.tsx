"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import type { CourseDto } from "@workspace/types"
import { Input } from "@workspace/ui/components/input"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground rtl:right-3 rtl:left-auto" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9 rtl:pr-9 rtl:pl-3"
        />
      </div>

      {/* Course Level Filter via Combobox */}
      <div className="w-full sm:w-56">
        <Combobox
          items={courseOptions}
          value={selectedCourseId}
          onValueChange={(val) => onCourseChange(val || "ALL")}
          placeholder={t("filter.allCourses")}
          clearable={false}
        />
      </div>

      {/* Status Filter via Combobox */}
      <div className="w-full sm:w-44">
        <Combobox
          items={statusOptions}
          value={selectedStatus}
          onValueChange={(val) => onStatusChange(val || "ALL")}
          placeholder={t("filter.allStatus")}
          searchable={false}
          clearable={false}
        />
      </div>
    </div>
  )
}
