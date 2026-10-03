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
  actions?: React.ReactNode
}

export function TermsFilter({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onAddClick,
  onBatchClick,
  actions,
}: TermsFilterProps) {
  const t = useTranslations("terms")

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ACTIVE", label: t("filter.activeOnly") },
      { value: "REGISTERING", label: t("filter.registeringOnly") },
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
    <TermsActionButton onAddClick={onAddClick} onBatchClick={onBatchClick} />
  )

  return (
    <AdminFilterBar
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
