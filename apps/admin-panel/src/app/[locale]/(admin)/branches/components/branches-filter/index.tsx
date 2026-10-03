import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

export interface BranchesFilterProps {
  search: string
  onSearchChange: (search: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function BranchesFilter({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onAddClick,
  actions,
}: BranchesFilterProps) {
  const t = useTranslations("branches")

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ACTIVE", label: t("filter.activeOnly") },
      { value: "INACTIVE", label: t("filter.inactiveOnly") },
    ]
  }, [t])

  const activeFiltersCount = selectedStatus && selectedStatus !== "ALL" ? 1 : 0

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onStatusChange("ALL")
  }, [onStatusChange])

  const desktopActions =
    actions ??
    (onAddClick && (
      <PermissionGuard permission={PERMISSIONS.MANAGE_BRANCHES} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("addBranch")}</span>
        </Button>
      </PermissionGuard>
    ))

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
