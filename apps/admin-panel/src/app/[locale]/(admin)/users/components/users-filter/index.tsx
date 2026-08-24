"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { ROLES } from "@workspace/types"
import { authResource } from "@/lib/api"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import {
  AdminFilterTabs,
  type FilterTabOption,
} from "@/components/admin-filter-tabs"

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
  const { data: currentUser } = useQuery(authResource.me.toQuery())

  const filterTabs: FilterTabOption[] = React.useMemo(() => {
    return [
      { key: "", label: t("filter.all") },
      { key: ROLES.ADMIN, label: t("roles.ADMIN") },
      { key: ROLES.SUPERVISOR, label: t("roles.SUPERVISOR") },
      { key: ROLES.ASSISTANT, label: t("roles.ASSISTANT") },
      { key: ROLES.SUPER_CLERK, label: t("roles.SUPER_CLERK") },
      { key: ROLES.CLERK, label: t("roles.CLERK") },
      { key: ROLES.TEACHER, label: t("roles.TEACHER") },
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
        <AdminFilterTabs
          options={filterTabs}
          value={selectedRole}
          onChange={onRoleChange}
        />
      }
    />
  )
}
