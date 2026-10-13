"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  MapPin,
  Phone,
  ChevronLeft,
  CheckCircle2,
  Clock,
} from "lucide-react"
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
              {/* Header: Icon, Name, and Arrow */}
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Building2 className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {branch.name}
                  </h3>
                  {branch.classesCount > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("demand.selectBranch.classesCountLabel", {
                        count: formatNumber(branch.classesCount, locale),
                      })}
                    </p>
                  )}
                </div>
                <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </div>

              {/* Middle: Address and Phone */}
              <div className="flex min-h-6 flex-col gap-1.5 text-xs text-muted-foreground">
                {branch.address ? (
                  <div className="flex items-start gap-1.5">
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                ) : null}
                {branch.phones && branch.phones.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Phone
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span dir="ltr">{branch.phones[0]}</span>
                  </div>
                ) : null}
              </div>

              {/* Footer: Term Status Badge */}
              <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                {isLoadingClasses ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Spinner className="size-3.5 text-muted-foreground" />
                    <span>...</span>
                  </div>
                ) : hasClassesInTerm ? (
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
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    <Clock
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    <span>{t("demand.selectBranch.noClasses")}</span>
                  </Badge>
                )}

                <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t("demand.selectBranch.selectBranchAction")}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
