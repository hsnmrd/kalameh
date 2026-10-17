import * as React from "react"
import { useTranslations } from "next-intl"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { TermsActionButton } from "../terms-action-button"

export interface TermsFilterProps {
  search: string
  onSearchChange: (search: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  onAddClick?: () => void
  onBatchClick?: () => void
  onSettingsClick?: () => void
  actions?: React.ReactNode
  isEmpty?: boolean
}

export function TermsFilter({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onAddClick,
  onBatchClick,
  onSettingsClick,
  actions,
  isEmpty,
}: TermsFilterProps) {
  const t = useTranslations("terms")

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ONGOING", label: t("filter.ongoingOnly") },
      { value: "REGISTERING", label: t("filter.registeringOnly") },
      { value: "CLASSES_STARTED", label: t("filter.classesStartedOnly") },
      { value: "FINAL_EXAMS", label: t("filter.finalExamsOnly") },
      { value: "GRADING", label: t("filter.gradingOnly") },
      { value: "UPCOMING", label: t("filter.upcomingOnly") },
      { value: "COMPLETED", label: t("filter.completedOnly") },
      { value: "INACTIVE", label: t("filter.inactiveOnly") },
    ]
  }, [t])

  const activeFiltersCount = selectedStatus && selectedStatus !== "ALL" ? 1 : 0

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onStatusChange("ALL")
  }, [onStatusChange])

  const desktopActions = actions ?? (
    <TermsActionButton
      onAddClick={onAddClick}
      onBatchClick={onBatchClick}
      onSettingsClick={onSettingsClick}
    />
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
          <FieldLabel>{t("filter.status")}</FieldLabel>
          <ResponsiveCombobox
            items={statusOptions}
            value={selectedStatus || "ALL"}
            onValueChange={(val) => onStatusChange(val || "ALL")}
            placeholder={t("filter.allStatus")}
            drawerTitle={t("filter.status")}
            clearable={false}
          />
        </Field>
      }
    />
  )
}
