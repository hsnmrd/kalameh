import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Plus, RotateCw, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { termsResource, branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { AdminFilterTabs } from "@/components/admin-filter-tabs"
import { PermissionGuard } from "@/components/permission-guard"

export type SchedulingTab = "demand" | "generation"

export interface SchedulingFilterProps {
  activeTab: SchedulingTab
  onTabChange: (tab: SchedulingTab) => void
  termId: string
  onTermChange: (termId: string) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  search: string
  onSearchChange: (search: string) => void
  onCalculateDemand: () => void
  isCalculating: boolean
  onApplyDemand: () => void
  isApplying: boolean
  hasDemands: boolean
  hasActiveRun?: boolean
  onResetRun?: () => void
  termOptions?: { value: string; label: string }[]
  registeredCount?: number
}

export function SchedulingFilter({
  activeTab,
  onTabChange,
  termId,
  onTermChange,
  branchId,
  onBranchChange,
  search,
  onSearchChange,
  onCalculateDemand,
  isCalculating,
  onApplyDemand,
  isApplying,
  hasDemands,
  hasActiveRun,
  onResetRun,
  termOptions: propTermOptions,
  registeredCount,
}: SchedulingFilterProps) {
  const t = useTranslations("scheduling")
  const { activeInstituteId } = useActiveInstitute()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: fetchedTermOptions = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: Boolean(activeInstituteId && !propTermOptions),
    select: (terms) =>
      terms.map((term) => ({
        value: term.id,
        label: term.title,
      })),
  })

  const termOptions = propTermOptions ?? fetchedTermOptions

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

  const activeFiltersCount =
    (termId ? 1 : 0) + (branchId && branchId !== "all" ? 1 : 0)

  const handleClearFilters = React.useCallback(() => {
    onTermChange("")
    onBranchChange("")
  }, [onTermChange, onBranchChange])

  const tabOptions = [
    { key: "demand" as const, label: t("demand.tabTitle") },
    { key: "generation" as const, label: t("demand.generationTabTitle") },
  ]

  const desktopActions = (
    <div className="flex items-center gap-3">
      <AdminFilterTabs
        options={tabOptions}
        value={activeTab}
        onChange={onTabChange}
      />

      {activeTab === "demand" ? (
        <>
          {hasDemands ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCalculateDemand}
                disabled={isCalculating || !termId}
                className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-4 text-sm font-semibold shadow-xs"
              >
                {isCalculating ? (
                  <Spinner className="size-4 text-foreground" />
                ) : (
                  <RotateCw className="size-4" />
                )}
                <span>{t("demand.recalculateButton")}</span>
              </Button>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="hide"
              >
                <Button
                  type="button"
                  onClick={onApplyDemand}
                  disabled={isApplying || !termId}
                  className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
                >
                  {isApplying ? (
                    <Spinner className="size-4 text-primary-foreground" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  <span>
                    {registeredCount && registeredCount > 0
                      ? t("demand.updateButton")
                      : t("demand.applyButton")}
                  </span>
                </Button>
              </PermissionGuard>
            </>
          ) : (
            <Button
              type="button"
              onClick={onCalculateDemand}
              disabled={isCalculating || !termId}
              className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
            >
              {isCalculating ? (
                <Spinner className="size-4 text-primary-foreground" />
              ) : (
                <Sparkles className="size-5" />
              )}
              <span>{t("demand.calculateButton")}</span>
            </Button>
          )}
        </>
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
            <FieldLabel>{t("demand.filters.term")}</FieldLabel>
            <ResponsiveCombobox
              items={termOptions}
              value={termId}
              onValueChange={(val) => onTermChange(val ?? "")}
              placeholder={t("generation.fields.term.placeholder")}
              searchPlaceholder={t("generation.fields.term.search")}
              emptyMessage={t("generation.fields.term.empty")}
              drawerTitle={t("demand.filters.term")}
              clearable={false}
            />
          </Field>

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
