"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import type { SchedulingTermStatus } from "@workspace/types"

export interface SchedulingTermsFilterProps {
  search: string
  onSearchChange: (search: string) => void
  status: string
  onStatusChange: (status: string) => void
}

export function SchedulingTermsFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: SchedulingTermsFilterProps) {
  const t = useTranslations("scheduling.termsList")

  const statusOptions = React.useMemo(
    () => [
      { value: "ALL", label: t("filters.statusAll") },
      { value: "READY_TO_SCHEDULE", label: t("statuses.READY_TO_SCHEDULE") },
      { value: "SCHEDULED", label: t("statuses.SCHEDULED") },
      { value: "PUBLISHED", label: t("statuses.PUBLISHED") },
      { value: "NO_REQUIREMENTS", label: t("statuses.NO_REQUIREMENTS") },
      { value: "GENERATING", label: t("statuses.GENERATING") },
    ],
    [t]
  )

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("filters.searchPlaceholder")}
          aria-label={t("filters.searchPlaceholder")}
        />
      }
      filters={
        <ResponsiveCombobox
          items={statusOptions}
          value={status}
          onValueChange={(val?: string) => onStatusChange(val || "ALL")}
          placeholder={t("filters.statusPlaceholder")}
          drawerTitle={t("filters.statusPlaceholder")}
          clearable={false}
          className="w-full sm:w-48"
        />
      }
    />
  )
}
