"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { termsResource, branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"

export interface SchedulingFilterProps {
  termId: string
  onTermChange: (termId: string) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  termOptions?: { value: string; label: string }[]
  hasActiveRun?: boolean
  onNewRun?: () => void
}

export function SchedulingFilter({
  termId,
  onTermChange,
  branchId,
  onBranchChange,
  termOptions: propTermOptions,
  hasActiveRun,
  onNewRun,
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

  const activeFiltersCount = branchId && branchId !== "all" ? 1 : 0

  const handleClearFilters = React.useCallback(() => {
    onBranchChange("")
  }, [onBranchChange])

  return (
    <AdminFilterBar
      isPinned={activeFiltersCount > 0}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      search={
        <ResponsiveCombobox
          items={termOptions}
          value={termId}
          onValueChange={(val) => onTermChange(val ?? "")}
          placeholder={t("generation.fields.term.placeholder")}
          searchPlaceholder={t("generation.fields.term.search")}
          emptyMessage={t("generation.fields.term.empty")}
          drawerTitle={t("demand.filters.term")}
          clearable={false}
          className="w-full"
        />
      }
      actions={
        hasActiveRun && onNewRun ? (
          <Button
            type="button"
            variant="outline"
            onClick={onNewRun}
            className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
          >
            <Plus className="size-5" />
            <span>{t("runStatus.another")}</span>
          </Button>
        ) : undefined
      }
      filters={
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
      }
    />
  )
}
