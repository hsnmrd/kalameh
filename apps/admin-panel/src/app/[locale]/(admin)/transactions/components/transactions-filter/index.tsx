"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { TRANSACTION_STATUSES, type TransactionStatus } from "@workspace/types"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface TransactionsFilterProps {
  search: string
  onSearchChange: (value: string) => void
  status: TransactionStatus | "ALL"
  onStatusChange: (value: TransactionStatus | "ALL") => void
}

export function TransactionsFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: TransactionsFilterProps) {
  const t = useTranslations("transactions")
  const statusOptions = React.useMemo<ComboboxOption[]>(
    () => [
      { value: "ALL", label: t("filter.all") },
      {
        value: TRANSACTION_STATUSES.PENDING,
        label: t("filter.pending"),
      },
      {
        value: TRANSACTION_STATUSES.APPROVED,
        label: t("filter.approved"),
      },
      {
        value: TRANSACTION_STATUSES.REJECTED,
        label: t("filter.rejected"),
      },
    ],
    [t]
  )
  const activeFiltersCount = status === "ALL" ? 0 : 1

  return (
    <AdminFilterBar
      autoHideOnMobile={false}
      isPinned={Boolean(search.trim() || activeFiltersCount)}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={() => onStatusChange("ALL")}
      filterDialogTitle={t("filter.title")}
      filterButtonAriaLabel={t("filter.title")}
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
            value={status}
            onValueChange={(value) =>
              onStatusChange((value || "ALL") as TransactionStatus | "ALL")
            }
            placeholder={t("filter.all")}
            drawerTitle={t("filter.status")}
            clearable={false}
          />
        </Field>
      }
    />
  )
}
