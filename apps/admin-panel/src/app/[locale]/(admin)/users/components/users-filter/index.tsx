import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { ROLES, PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

export interface UsersFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedRole: string
  onRoleChange: (role: string) => void
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function UsersFilter({
  searchValue,
  onSearchChange,
  selectedRole,
  onRoleChange,
  onAddClick,
  actions,
}: UsersFilterProps) {
  const t = useTranslations("users")

  const roleOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("filter.all") },
      { value: ROLES.ADMIN, label: t("roles.ADMIN") },
      { value: ROLES.SUPERVISOR, label: t("roles.SUPERVISOR") },
      { value: ROLES.ASSISTANT, label: t("roles.ASSISTANT") },
      { value: ROLES.SUPER_CLERK, label: t("roles.SUPER_CLERK") },
      { value: ROLES.CLERK, label: t("roles.CLERK") },
      { value: ROLES.TEACHER, label: t("roles.TEACHER") },
    ]
  }, [t])

  const activeFiltersCount =
    selectedRole && selectedRole !== "ALL" && selectedRole !== "" ? 1 : 0

  const hasActiveFilter = Boolean(searchValue.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onRoleChange("ALL")
  }, [onRoleChange])

  const desktopActions =
    actions ??
    (onAddClick && (
      <PermissionGuard permission={PERMISSIONS.MANAGE_USERS} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("addUser")}</span>
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
          <FieldLabel>{t("filter.role")}</FieldLabel>
          <ResponsiveCombobox
            items={roleOptions}
            value={selectedRole || "ALL"}
            onValueChange={(val) =>
              onRoleChange(val === "ALL" || !val ? "" : val)
            }
            placeholder={t("filter.all")}
            drawerTitle={t("filter.role")}
            clearable={false}
          />
        </Field>
      }
    />
  )
}
