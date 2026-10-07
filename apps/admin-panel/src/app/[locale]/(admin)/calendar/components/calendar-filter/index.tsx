"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarOff } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import type { TermDto } from "@workspace/types"
import { Link } from "@/i18n/routing"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"

export interface CalendarFilterProps {
  search: string
  onSearchChange: (search: string) => void
  selectedYear: number
  currentYear: number
  onYearChange: (year: number) => void
  viewMode: "year" | "month"
  onViewModeChange: (mode: "year" | "month") => void
  selectedTermId?: string
  onTermChange?: (termId: string) => void
  terms?: TermDto[]
  locale: "fa" | "en"
  actions?: React.ReactNode
}

export type OffDaysFilterProps = CalendarFilterProps

function formatYear(year: number, locale: "fa" | "en"): string {
  if (locale === "fa") {
    return String(year).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)] ?? d)
  }
  return String(year)
}

export function CalendarFilter({
  search,
  onSearchChange,
  selectedYear,
  currentYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  selectedTermId = "ALL",
  onTermChange,
  terms = [],
  locale,
  actions,
}: CalendarFilterProps) {
  const t = useTranslations("setting.offDays")

  const yearOptions: ComboboxOption[] = React.useMemo(() => {
    const yearSet = new Set([
      currentYear - 2,
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2,
      selectedYear,
    ])
    return Array.from(yearSet)
      .sort((a, b) => a - b)
      .map((year) => ({
        value: String(year),
        label: formatYear(year, locale),
      }))
  }, [currentYear, selectedYear, locale])

  const viewModeOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "year", label: t("yearView") },
      { value: "month", label: t("monthView") },
    ]
  }, [t])

  const termOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "ALL", label: t("allTerms") },
      ...terms.map((term) => ({
        value: term.id,
        label: term.title,
      })),
    ]
  }, [terms, t])

  const isYearFiltered = selectedYear !== currentYear
  const isViewModeFiltered = viewMode !== "year"
  const isTermFiltered = selectedTermId !== "ALL"

  const activeFiltersCount =
    (isYearFiltered ? 1 : 0) +
    (isViewModeFiltered ? 1 : 0) +
    (isTermFiltered ? 1 : 0)

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onSearchChange("")
    onYearChange(currentYear)
    onViewModeChange("year")
    onTermChange?.("ALL")
  }, [
    currentYear,
    onSearchChange,
    onYearChange,
    onViewModeChange,
    onTermChange,
  ])

  const desktopActions = actions ?? (
    <Link href="/calendar/custom">
      <Button
        type="button"
        className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
      >
        <CalendarOff className="size-5" />
        <span>{t("manageCustomOffDays")}</span>
      </Button>
    </Link>
  )

  return (
    <AdminFilterBar
      isPinned={hasActiveFilter}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      filterDialogTitle={t("calendarFilterTitle")}
      actions={desktopActions}
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchCalendarPlaceholder")}
        />
      }
      filters={
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t("yearFilterLabel")}</FieldLabel>
            <ResponsiveCombobox
              items={yearOptions}
              value={String(selectedYear)}
              onValueChange={(val) => {
                if (val) onYearChange(Number(val))
              }}
              placeholder={t("yearFilterLabel")}
              drawerTitle={t("yearFilterLabel")}
              clearable={false}
            />
          </Field>

          <Field>
            <FieldLabel>{t("viewModeLabel")}</FieldLabel>
            <ResponsiveCombobox
              items={viewModeOptions}
              value={viewMode}
              onValueChange={(val) => {
                if (val === "year" || val === "month") {
                  onViewModeChange(val)
                }
              }}
              placeholder={t("viewModeLabel")}
              drawerTitle={t("viewModeLabel")}
              clearable={false}
            />
          </Field>

          {terms.length > 0 && (
            <Field>
              <FieldLabel>{t("termFilterLabel")}</FieldLabel>
              <ResponsiveCombobox
                items={termOptions}
                value={selectedTermId}
                onValueChange={(val) => onTermChange?.(val || "ALL")}
                placeholder={t("allTerms")}
                drawerTitle={t("termFilterLabel")}
                clearable={false}
              />
            </Field>
          )}
        </div>
      }
    />
  )
}

export const OffDaysFilter = CalendarFilter
