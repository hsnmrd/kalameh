"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import type { ClassRequirementDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { FieldLabel } from "@workspace/ui/components/field"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingRequirementCardProps {
  item: ClassRequirementDto
  isSelected: boolean
  onToggle: (checked: boolean) => void
}

export function SchedulingRequirementCard({
  item,
  isSelected,
  onToggle,
}: SchedulingRequirementCardProps) {
  const t = useTranslations("scheduling.generation.requirements")
  const locale = useLocale()
  const checkboxId = `requirement-card-${item.id}`

  return (
    <div className="flex min-h-16 items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40">
      <Checkbox
        id={checkboxId}
        checked={isSelected}
        onCheckedChange={(value) => onToggle(Boolean(value))}
        className="mt-0.5"
      />
      <FieldLabel
        htmlFor={checkboxId}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 leading-5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-semibold text-foreground">
            {item.course?.title ?? t("unnamed")}
          </span>
          <Badge
            variant="outline"
            className="h-5 px-1.5 py-0 text-[10px] font-normal"
          >
            {t(`deliveryModes.${item.deliveryMode}`)}
          </Badge>
          {item.branch?.name && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
            >
              {item.branch.name}
            </Badge>
          )}
        </div>
        <span className="text-xs font-normal text-muted-foreground">
          {t("summary", {
            classes: formatNumber(item.requiredClassCount, locale),
            capacity: formatNumber(item.capacity, locale),
          })}
        </span>
      </FieldLabel>
    </div>
  )
}
