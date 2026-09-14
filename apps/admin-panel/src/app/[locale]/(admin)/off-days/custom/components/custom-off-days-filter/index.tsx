"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface CustomOffDaysFilterProps {
  search: string
  onSearchChange: (search: string) => void
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function CustomOffDaysFilter({
  search,
  onSearchChange,
  onAddClick,
  actions,
}: CustomOffDaysFilterProps) {
  const t = useTranslations("setting.offDays")

  const desktopActions =
    actions ??
    (onAddClick && (
      <Button
        type="button"
        onClick={onAddClick}
        className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
      >
        <Plus className="size-5" />
        <span>{t("addOffDay")}</span>
      </Button>
    ))

  return (
    <AdminFilterBar
      isPinned={Boolean(search.trim())}
      actions={desktopActions}
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchCustomOffDaysPlaceholder")}
        />
      }
    />
  )
}
