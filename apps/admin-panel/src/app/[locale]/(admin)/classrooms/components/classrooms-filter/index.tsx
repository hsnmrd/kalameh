import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { PERMISSIONS, type BranchWithStats } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

export interface ClassroomsFilterProps {
  search: string
  onSearchChange: (search: string) => void
  selectedBranchId: string
  onBranchChange: (branchId: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  branches: BranchWithStats[]
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function ClassroomsFilter({
  search,
  onSearchChange,
  selectedBranchId,
  onBranchChange,
  selectedStatus,
  onStatusChange,
  branches,
  onAddClick,
  actions,
}: ClassroomsFilterProps) {
  const t = useTranslations("classrooms")

  const branchOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allBranches") },
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ]
  }, [branches, t])

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.allStatus") },
      { value: "ACTIVE", label: t("filter.activeOnly") },
      { value: "INACTIVE", label: t("filter.inactiveOnly") },
    ]
  }, [t])

  const activeFiltersCount =
    (selectedBranchId && selectedBranchId !== "ALL" ? 1 : 0) +
    (selectedStatus && selectedStatus !== "ALL" ? 1 : 0)

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onBranchChange("ALL")
    onStatusChange("ALL")
  }, [onBranchChange, onStatusChange])

  const desktopActions =
    actions ??
    (onAddClick && (
      <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSROOMS} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("addClassroom")}</span>
        </Button>
      </PermissionGuard>
    ))

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      activeFiltersCount={activeFiltersCount}
      isPinned={hasActiveFilter}
      onClearFilters={handleClearFilters}
      filterDialogTitle={t("filter.title")}
      actions={desktopActions}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field className="space-y-1.5">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("filter.branch")}
          </FieldLabel>
          <ResponsiveCombobox
            items={branchOptions}
            value={selectedBranchId}
            onValueChange={(val) => onBranchChange(val ?? "ALL")}
            placeholder={t("filter.branch")}
          />
        </Field>

        <Field className="space-y-1.5">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("filter.status")}
          </FieldLabel>
          <ResponsiveCombobox
            items={statusOptions}
            value={selectedStatus}
            onValueChange={(val) => onStatusChange(val ?? "ALL")}
            placeholder={t("filter.status")}
          />
        </Field>
      </div>
    </AdminFilterBar>
  )
}
