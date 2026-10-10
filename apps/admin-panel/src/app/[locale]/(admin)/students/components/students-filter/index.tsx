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
import { StudentsActionButton } from "../students-action-button"

export interface StudentsFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedCourseId: string
  onCourseChange: (value: string) => void
  selectedBranchId?: string
  onBranchChange?: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  courses?: CourseDto[]
  branches?: { id: string; name: string }[]
  onAddClick?: () => void
  onSetAllAvailableClick?: () => void
  actions?: React.ReactNode
  disabled?: boolean
}

export function StudentsFilter({
  searchValue,
  onSearchChange,
  selectedCourseId,
  onCourseChange,
  selectedBranchId = "ALL",
  onBranchChange,
  selectedStatus,
  onStatusChange,
  courses = [],
  branches = [],
  onAddClick,
  onSetAllAvailableClick,
  actions,
  disabled = false,
}: StudentsFilterProps) {
  const t = useTranslations("students")

  const courseOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allCourses") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ]
  }, [courses, t])

  const branchOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allBranches") },
      ...branches.map((b) => ({ value: b.id, label: b.name })),
    ]
  }, [branches, t])

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ACTIVE", label: t("filter.active") },
      { value: "INACTIVE", label: t("filter.inactive") },
    ]
  }, [t])

  const activeFiltersCount =
    (selectedCourseId !== "ALL" ? 1 : 0) +
    (selectedBranchId !== "ALL" ? 1 : 0) +
    (selectedStatus !== "ALL" ? 1 : 0)

  const hasActiveFilter = Boolean(searchValue.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onCourseChange("ALL")
    onBranchChange?.("ALL")
    onStatusChange("ALL")
  }, [onCourseChange, onBranchChange, onStatusChange])

  const desktopActions =
    actions ??
    ((onAddClick || onSetAllAvailableClick) && (
      <StudentsActionButton
        onAddClick={onAddClick}
        onSetAllAvailableClick={onSetAllAvailableClick}
        disabled={disabled}
      />
    ))

  return (
    <AdminFilterBar
      isPinned={hasActiveFilter}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      actions={desktopActions}
      disabled={disabled}
      search={
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
          disabled={disabled}
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
              disabled={disabled}
            />
          </Field>

          {/* Branch Combobox Filter */}
          {branches.length > 0 && onBranchChange && (
            <Field>
              <FieldLabel>{t("filter.branch")}</FieldLabel>
              <ResponsiveCombobox
                items={branchOptions}
                value={selectedBranchId}
                onValueChange={(val) => onBranchChange(val || "ALL")}
                placeholder={t("filter.allBranches")}
                drawerTitle={t("filter.branch")}
                clearable={false}
                disabled={disabled}
              />
            </Field>
          )}

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
              disabled={disabled}
            />
          </Field>
        </>
      }
    />
  )
}
