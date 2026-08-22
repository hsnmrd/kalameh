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
    const tabs = [{ key: "", label: t("filter.all") }]

    tabs.push({ key: ROLES.CLERK, label: t("filter.clerks") })

    if (
      currentUser?.role === ROLES.SUPER_ADMIN ||
      currentUser?.role === ROLES.INSTITUTE_ADMIN
    ) {
      tabs.push({ key: ROLES.INSTITUTE_ADMIN, label: t("filter.admins") })
    }

    return tabs
  }, [currentUser?.role, t])

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
