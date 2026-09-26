"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS, type SchedulingTermSummaryDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Counter } from "@workspace/ui/components/counter"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { PermissionGuard } from "@/components/permission-guard"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { TermSummaryBar } from "../term-summary-bar"

export interface SchedulingFilterProps {
  term?: SchedulingTermSummaryDto | null
  isLoadingTerm?: boolean
  branchId: string
  onBranchChange: (branchId: string) => void
  maxStudentsPerClass: number
  onMaxStudentsPerClassChange: (value: number) => void
  maxAvailableRoomCapacity: number | null
  onGenerateSchedule?: () => void
  isGenerating?: boolean
}

export function SchedulingFilter({
  term,
  isLoadingTerm,
  branchId,
  onBranchChange,
  maxStudentsPerClass,
  onMaxStudentsPerClassChange,
  maxAvailableRoomCapacity,
  onGenerateSchedule,
  isGenerating,
}: SchedulingFilterProps) {
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
      search={<TermSummaryBar term={term} isLoading={isLoadingTerm} />}
      actions={
        onGenerateSchedule ? (
          <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
            <Button
              type="button"
              onClick={onGenerateSchedule}
              disabled={!term || isGenerating}
              className="shrink-0 cursor-pointer gap-2 px-5 font-semibold shadow-xs"
            >
              {isGenerating ? (
                <Spinner className="size-5" />
              ) : (
                <CalendarPlus className="size-5" />
              )}
              <span>{t("demand.applyAndContinue")}</span>
            </Button>
          </PermissionGuard>
        ) : undefined
      }
      filters={
        <>
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
          <Field>
            <FieldLabel>{t("demand.filters.maxStudents")}</FieldLabel>
            <Counter
              min={1}
              max={100}
              value={maxStudentsPerClass}
              onValueChange={onMaxStudentsPerClassChange}
              aria-label={t("demand.filters.maxStudents")}
            />
            <FieldDescription>
              {maxAvailableRoomCapacity === null
                ? t("demand.filters.noRoomCeiling")
                : t("demand.filters.roomCeiling", {
                    count: maxAvailableRoomCapacity,
                  })}
            </FieldDescription>
          </Field>
        </>
      }
    />
  )
}
