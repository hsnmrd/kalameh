"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface TeacherCalendarFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedTermId: string
  onTermChange: (value: string) => void
  actions?: React.ReactNode
}

export function TeacherCalendarFilter({
  searchValue,
  onSearchChange,
  selectedTermId,
  onTermChange,
  actions,
}: TeacherCalendarFilterProps) {
  const tTeachers = useTranslations("teachers")
  const tClasses = useTranslations("classes")
  const { activeInstituteId } = useActiveInstitute()

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const termOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: tClasses("allTerms") },
      ...terms.map((term) => ({
        value: term.id,
        label: term.title,
      })),
    ]
  }, [terms, tClasses])

  const activeFiltersCount = selectedTermId !== "ALL" ? 1 : 0
  const hasActiveFilter = Boolean(searchValue.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onSearchChange("")
    onTermChange("ALL")
  }, [onSearchChange, onTermChange])

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={tTeachers("searchPlaceholder")}
        />
      }
      filters={
        <Field className="w-full sm:w-56">
          <FieldLabel className="sr-only">{tClasses("termFilter")}</FieldLabel>
          <ResponsiveCombobox
            items={termOptions}
            value={selectedTermId}
            onValueChange={onTermChange}
            placeholder={tClasses("termFilter")}
            searchPlaceholder={tClasses("termFilter")}
            emptyMessage={tTeachers("table.empty")}
            drawerTitle={tClasses("termFilter")}
            aria-label={tClasses("termFilter")}
            clearable={false}
          />
        </Field>
      }
      actions={actions}
      activeFiltersCount={activeFiltersCount}
      isPinned={hasActiveFilter}
      onClearFilters={handleClearFilters}
    />
  )
}
