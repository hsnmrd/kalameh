"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Building2, ChevronLeft, CheckCircle2 } from "lucide-react"
import type { BranchDto, SchedulingTermSummaryDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface SchedulingBranchSelectionProps {
  branches: BranchDto[]
  selectedTerm?: SchedulingTermSummaryDto | null
  onSelectBranch: (branchId: string) => void
}

export function SchedulingBranchSelection({
  branches,
  selectedTerm,
  onSelectBranch,
}: SchedulingBranchSelectionProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const { activeInstituteId } = useActiveInstitute()

  const { data: termClasses = [], isLoading: isLoadingClasses } = useQuery({
    ...classesResource.list.toQuery(
      activeInstituteId && selectedTerm?.id
        ? {
            instituteId: activeInstituteId,
            termId: selectedTerm.id,
          }
        : undefined
    ),
    enabled: Boolean(activeInstituteId && selectedTerm?.id),
  })

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Informative Guidance Section */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold text-foreground">
          {t("demand.selectBranch.title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("demand.selectBranch.description")}
        </p>
      </div>

      {/* Grid of Branch Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const branchClassesCount = termClasses.filter(
            (cls) => cls.branchId === branch.id
          ).length
          const hasClassesInTerm = branchClassesCount > 0

          return (
            <div
              key={branch.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectBranch(branch.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelectBranch(branch.id)
                }
              }}
              className="group relative flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 text-start transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              {/* Header: Icon, Name, Address with ellipsis, and Arrow */}
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Building2 className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {branch.name}
                  </h3>
                  {branch.address ? (
                    <p
                      className="mt-0.5 truncate text-xs text-muted-foreground"
                      title={branch.address}
                    >
                      {branch.address}
                    </p>
                  ) : null}
                </div>
                <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>

              {/* Footer: Term Status Badge & Action */}
              {isLoadingClasses || hasClassesInTerm ? (
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  {isLoadingClasses ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Spinner className="size-3.5 text-muted-foreground" />
                      <span>...</span>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-success/30 bg-success/15 px-2.5 py-1 text-xs font-medium text-success"
                    >
                      <CheckCircle2
                        className="size-3.5 text-success"
                        aria-hidden
                      />
                      <span>
                        {t("demand.selectBranch.hasClasses", {
                          count: formatNumber(branchClassesCount, locale),
                        })}
                      </span>
                    </Badge>
                  )}

                  <span className="hidden text-xs font-semibold text-primary transition-opacity group-hover:opacity-100 sm:inline sm:opacity-0">
                    {t("demand.selectBranch.selectBranchAction")}
                  </span>
                </div>
              ) : (
                <div className="hidden items-center justify-end gap-2 border-t border-transparent pt-3 sm:flex">
                  <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {t("demand.selectBranch.selectBranchAction")}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
