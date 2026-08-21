"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { ROLES } from "@workspace/types"
import { authResource } from "@/lib/api"

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

  const filterTabs = React.useMemo(() => {
    const tabs = [
      { key: "", label: t("filter.all") },
      { key: ROLES.STUDENT, label: t("filter.students") },
    ]

    if (
      currentUser?.role === ROLES.INSTITUTE_ADMIN ||
      currentUser?.role === ROLES.SUPER_ADMIN
    ) {
      tabs.push({ key: ROLES.CLERK, label: t("filter.clerks") })
    }

    if (currentUser?.role === ROLES.SUPER_ADMIN) {
      tabs.push({ key: ROLES.INSTITUTE_ADMIN, label: t("filter.admins") })
    }

    return tabs
  }, [currentUser?.role, t])

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 rounded-xl border-slate-200 bg-white ps-9 text-sm"
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
        {filterTabs.map((tab) => {
          const isSelected = selectedRole === tab.key
          return (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              onClick={() => onRoleChange(tab.key)}
              className={
                isSelected
                  ? "rounded-lg bg-white font-medium text-slate-900 shadow-2xs hover:bg-white"
                  : "rounded-lg text-slate-600 hover:text-slate-900"
              }
            >
              {tab.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
