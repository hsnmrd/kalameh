"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Pencil, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { AdminFilterTabs } from "@/components/admin-filter-tabs"
import { PermissionGuard } from "@/components/permission-guard"

export type SchedulingWorkspaceTab = "demand" | "generation"

export interface TermWorkspaceFilterProps {
  termId: string
  activeTab: SchedulingWorkspaceTab
  onTabChange: (tab: SchedulingWorkspaceTab) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  search: string
  onSearchChange: (search: string) => void
  hasActiveRun?: boolean
  onResetRun?: () => void
}

export function TermWorkspaceFilter({
  termId,
  activeTab,
  onTabChange,
  branchId,
  onBranchChange,
  search,
  onSearchChange,
  hasActiveRun,
  onResetRun,
}: TermWorkspaceFilterProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const { activeInstituteId } = useActiveInstitute()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const {
    data: branchOptions = [
      { value: "all", label: t("demand.filters.allBranches") },
    ],
  } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: Boolean(activeInstituteId),
    select: (branches) => [
      { value: "all", label: t("demand.filters.allBranches") },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    ],
  })

  const activeFiltersCount = branchId && branchId !== "all" ? 1 : 0

  const handleClearFilters = React.useCallback(() => {
    onBranchChange("")
  }, [onBranchChange])

  const tabOptions = [
    { key: "demand" as const, label: t("termsList.termWorkspace.tabs.demand") },
    {
      key: "generation" as const,
      label: t("termsList.termWorkspace.tabs.schedule"),
    },
  ]

  const desktopActions = (
    <div className="flex items-center gap-3">
      <AdminFilterTabs
        options={tabOptions}
        value={activeTab}
        onChange={onTabChange}
      />

      {activeTab === "demand" ? (
        <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="hide">
          <Button
            nativeButton={false}
            render={
              <Link
                href={`/${locale}/scheduling/${termId}/requirements`}
                className="gap-2"
              />
            }
            className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
          >
            <Pencil className="size-4" />
            <span>{t("demand.manageRequirementsButton")}</span>
          </Button>
        </PermissionGuard>
      ) : hasActiveRun && onResetRun ? (
        <Button
          type="button"
          variant="outline"
          onClick={onResetRun}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("runStatus.another")}</span>
        </Button>
      ) : null}
    </div>
  )

  return (
    <AdminFilterBar
      isPinned={Boolean(search.trim() || activeFiltersCount > 0)}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      actions={desktopActions}
      search={
        activeTab === "demand" ? (
          <AdminSearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={t("demand.filters.search")}
          />
        ) : undefined
      }
      filters={
        <>
          <div className="flex flex-col gap-1.5 sm:hidden">
            <span className="text-xs font-medium text-muted-foreground">
              {t("workflow.title")}
            </span>
            <AdminFilterTabs
              options={tabOptions}
              value={activeTab}
              onChange={onTabChange}
            />
          </div>

          <Field>
            <FieldLabel>{t("demand.filters.branch")}</FieldLabel>
            <ResponsiveCombobox
              items={branchOptions}
              value={branchId || "all"}
              onValueChange={(val) =>
                onBranchChange(val === "all" || !val ? "" : val)
              }
              placeholder={t("demand.filters.branch")}
              drawerTitle={t("demand.filters.branch")}
              clearable={false}
            />
          </Field>
        </>
      }
    />
  )
}
