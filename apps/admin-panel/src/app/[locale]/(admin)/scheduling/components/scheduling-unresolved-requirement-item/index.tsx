"use client"

import { useLocale, useTranslations } from "next-intl"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

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

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-foreground">
          {requirement.classRequirement?.course.title ?? t("unknownCourse")}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t(`unresolvedReasons.${requirement.reasonCode}`)}
        </p>
      </div>
      <Badge variant="warning">
        {t("missingCount", {
          count: formatNumber(requirement.missingClassCount, locale),
        })}
      </Badge>
    </li>
  )
}
