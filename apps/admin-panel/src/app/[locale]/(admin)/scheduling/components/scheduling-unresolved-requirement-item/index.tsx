"use client"

import { useLocale, useTranslations } from "next-intl"
import { Lightbulb, SearchCheck } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingRecoveryOption } from "../scheduling-recovery-option"

type UnresolvedRequirement =
  SchedulingPlanDetailsDto["unresolvedRequirements"][number]

interface SchedulingUnresolvedRequirementItemProps {
  requirement: UnresolvedRequirement
}

export function SchedulingUnresolvedRequirementItem({
  requirement,
}: SchedulingUnresolvedRequirementItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const recovery = requirement.recovery ?? {
    options: [],
    totalOptionCount: 0,
    qualifiedTeacherCount: 0,
    compatibleClassroomCount: 0,
  }
  const visibleOptions = recovery.options.slice(0, 3)

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">
            {requirement.classRequirement?.course.title ?? t("unknownCourse")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t(`unresolvedReasons.${requirement.reasonCode}`)}
          </p>
        </div>
        <Badge variant="warning" className="shrink-0 self-start">
          {t("missingCount", {
            count: formatNumber(requirement.missingClassCount, locale),
          })}
        </Badge>
      </div>

      <div className="rounded-xl bg-muted/40 p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <SearchCheck
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-foreground"
            />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("recovery.title")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {t(
                  requirement.classRequirement?.deliveryMode === "ONLINE"
                    ? "recovery.onlineSummary"
                    : "recovery.summary",
                  {
                    teachers: formatNumber(
                      recovery.qualifiedTeacherCount,
                      locale
                    ),
                    rooms: formatNumber(
                      recovery.compatibleClassroomCount,
                      locale
                    ),
                  }
                )}
              </p>
            </div>
          </div>
          {recovery.totalOptionCount > 0 && (
            <Badge variant="secondary">
              {t("recovery.optionCount", {
                total: formatNumber(recovery.totalOptionCount, locale),
                shown: formatNumber(visibleOptions.length, locale),
              })}
            </Badge>
          )}
        </div>

        {visibleOptions.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {visibleOptions.map((option) => (
              <SchedulingRecoveryOption key={option.key} option={option} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-background px-3 py-2.5">
            <Lightbulb
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("recovery.noOptionTitle")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {t(`unresolvedSuggestions.${requirement.reasonCode}`)}
              </p>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
