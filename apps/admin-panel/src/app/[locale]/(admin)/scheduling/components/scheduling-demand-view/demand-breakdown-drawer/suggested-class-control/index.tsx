"use client"

import { useLocale, useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import type { SuggestedClassDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Counter } from "@workspace/ui/components/counter"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

interface SuggestedClassControlProps {
  item: SuggestedClassDto
  index: number
  courseTitle: string
  capacityLimit: number
  compact?: boolean
  onCapacityChange: (capacity: number) => void
  onRemove: () => void
}

export function SuggestedClassControl({
  item,
  index,
  courseTitle,
  capacityLimit,
  compact = false,
  onCapacityChange,
  onRemove,
}: SuggestedClassControlProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()
  const label = t("classLabel", { count: formatNumber(index + 1, locale) })

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact &&
          "rounded-xl border border-border/60 bg-muted/20 px-2.5 py-1.5"
      )}
    >
      <span
        className={cn(
          "shrink-0 text-xs font-medium whitespace-nowrap text-muted-foreground",
          !compact && "w-16"
        )}
      >
        {label}
      </span>
      <Counter
        size={compact ? "sm" : "default"}
        min={1}
        max={capacityLimit}
        value={item.capacity}
        onValueChange={onCapacityChange}
        className={compact ? "w-28" : "min-w-0 flex-1"}
        aria-label={`${t("capacity")} - ${courseTitle} - ${label}`}
      />
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-sm" : "icon"}
        className="shrink-0 text-destructive hover:text-destructive"
        onClick={onRemove}
        aria-label={`${t("removeClass")} - ${courseTitle} - ${label}`}
      >
        <Trash2 aria-hidden />
        <span className="sr-only">{t("removeClass")}</span>
      </Button>
    </div>
  )
}
