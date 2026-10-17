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
import { CoursesActionButton } from "../courses-action-button"

export interface CoursesFilterProps {
  search: string
  onSearchChange: (search: string) => void
  selectedPrerequisiteId: string
  onPrerequisiteChange: (id: string) => void
  courses?: CourseDto[]
  onAddClick?: () => void
  onBatchClick?: () => void
  actions?: React.ReactNode
  isEmpty?: boolean
}

export function CoursesFilter({
  search,
  onSearchChange,
  selectedPrerequisiteId,
  onPrerequisiteChange,
  courses = [],
  onAddClick,
  onBatchClick,
  actions,
  isEmpty,
}: CoursesFilterProps) {
  const t = useTranslations("courses")

  const prerequisiteOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allPrerequisites") },
      { value: "NONE", label: t("filter.baseOnly") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ]
  }, [courses, t])

  const activeFiltersCount =
    selectedPrerequisiteId && selectedPrerequisiteId !== "ALL" ? 1 : 0

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onPrerequisiteChange("ALL")
  }, [onPrerequisiteChange])

  const desktopActions = actions ?? (
    <CoursesActionButton onAddClick={onAddClick} onBatchClick={onBatchClick} />
  )

  return (
    <AdminFilterBar
      isEmpty={isEmpty}
      isPinned={hasActiveFilter}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      actions={desktopActions}
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <Field>
          <FieldLabel>{t("filter.prerequisite")}</FieldLabel>
          <ResponsiveCombobox
            items={prerequisiteOptions}
            value={selectedPrerequisiteId || "ALL"}
            onValueChange={(val) => onPrerequisiteChange(val || "ALL")}
            placeholder={t("filter.allPrerequisites")}
            drawerTitle={t("filter.prerequisite")}
            clearable={false}
          />
        </Field>
      }
    />
  )
}
