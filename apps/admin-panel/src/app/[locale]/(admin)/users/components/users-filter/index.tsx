"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ROLES } from "@workspace/types"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface UsersFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  selectedRole: string
  onRoleChange: (role: string) => void
}

export function UsersFilter({
  searchValue,
  onSearchChange,
  selectedRole,
  onRoleChange,
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

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <div className="w-full sm:w-56">
          <Combobox
            items={roleOptions}
            value={selectedRole || "ALL"}
            onValueChange={(val) =>
              onRoleChange(val === "ALL" || !val ? "" : val)
            }
            placeholder={t("filter.all")}
            clearable={false}
          />
        </div>
      }
    />
  )
}
