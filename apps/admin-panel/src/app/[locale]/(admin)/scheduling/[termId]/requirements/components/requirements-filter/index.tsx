"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

export interface RequirementsFilterProps {
  search: string
  onSearchChange: (search: string) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  onAddClick: () => void
  onSyncDemandClick: () => void
  isSyncing?: boolean
}

export function RequirementsFilter({
  search,
  onSearchChange,
  branchId,
  onBranchChange,
  onAddClick,
  onSyncDemandClick,
  isSyncing,
}: RequirementsFilterProps) {
  const t = useTranslations("scheduling")
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
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ],
  })

  const activeFiltersCount = branchId && branchId !== "all" ? 1 : 0

  const handleClearFilters = React.useCallback(() => {
    onBranchChange("")
  }, [onBranchChange])

  const desktopActions = (
    <div className="flex items-center gap-3">
      <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
        <Button
          type="button"
          variant="outline"
          onClick={onSyncDemandClick}
          disabled={isSyncing}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-4 text-sm font-semibold shadow-xs"
        >
          {isSyncing ? (
            <Spinner className="size-4 text-foreground" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span>{t("requirementsPage.syncDemand")}</span>
        </Button>
      </PermissionGuard>

      <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("requirementsPage.addRequirement")}</span>
        </Button>
      </PermissionGuard>
    </div>
  )

  return (
    <AdminFilterBar
      isPinned={Boolean(search.trim() || activeFiltersCount > 0)}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      actions={desktopActions}
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("requirementsPage.fields.coursePlaceholder")}
        />
      }
      filters={
        <Field>
          <FieldLabel>{t("requirementsPage.fields.branch")}</FieldLabel>
          <ResponsiveCombobox
            items={branchOptions}
            value={branchId || "all"}
            onValueChange={(val) =>
              onBranchChange(val === "all" || !val ? "" : val)
            }
            placeholder={t("requirementsPage.fields.branchPlaceholder")}
            drawerTitle={t("requirementsPage.fields.branchPlaceholder")}
            clearable={false}
          />
        </Field>
      }
    />
  )
}
