"use client"

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

export interface TeachersFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function TeachersFilter({
  searchValue,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onAddClick,
  actions,
}: TeachersFilterProps) {
  const t = useTranslations("teachers")

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.all") },
      { value: "ACTIVE", label: t("filter.active") },
      { value: "INACTIVE", label: t("filter.inactive") },
    ]
  }, [t])

  const activeFiltersCount = selectedStatus !== "ALL" ? 1 : 0
  const hasActiveFilter = Boolean(searchValue.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onStatusChange("ALL")
  }, [onStatusChange])

  const desktopActions =
    actions ??
    (onAddClick && (
      <PermissionGuard permission={PERMISSIONS.MANAGE_TEACHERS} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("addTeacher")}</span>
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
          value={searchValue}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <Field>
          <FieldLabel>{t("table.status")}</FieldLabel>
          <ResponsiveCombobox
            items={statusOptions}
            value={selectedStatus}
            onValueChange={(val) => onStatusChange(val || "ALL")}
            drawerTitle={t("table.status")}
          />
        </Field>
      }
    />
  )
}
