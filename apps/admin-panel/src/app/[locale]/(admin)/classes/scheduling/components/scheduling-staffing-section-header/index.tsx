"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import {
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingStaffingSectionHeaderProps {
  branchNumber?: number
  icon: React.ComponentType<{
    className?: string
    "aria-hidden"?: boolean | "true" | "false"
  }>
  title: string
  badgeLabel?: string | null
  badgeVariant?: "default" | "secondary" | "outline" | "destructive" | "success"
  badgeClassName?: string
  total?: number
  counterText?: string
  className?: string
}

export function SchedulingStaffingSectionHeader({
  branchNumber,
  icon: Icon,
  title,
  badgeLabel,
  badgeVariant = "secondary",
  badgeClassName,
  total = 0,
  counterText,
  className,
}: SchedulingStaffingSectionHeaderProps) {
  const t = useTranslations("scheduling.planDetails.staffingFallback")
  const locale = useLocale()
  const hasMultiple = total > 1

  return (
    <div className={cn("space-y-2", className)}>
      {/* Row 1: Branch number + Icon + Title (with 4px gap) & Number of suggestions across */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {typeof branchNumber === "number" && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
            >
              {t("branchPrefix", {
                number: formatNumber(branchNumber, locale),
              })}
            </Badge>
          )}
          <div className="flex min-w-0 items-center gap-1">
            <Icon aria-hidden className="size-4 shrink-0 text-foreground" />
            <h4 className="truncate text-sm font-bold text-foreground">
              {title}
            </h4>
          </div>
        </div>
        {badgeLabel && (
          <Badge
            variant={badgeVariant}
            className={cn("text-xs font-semibold", badgeClassName)}
          >
            {badgeLabel}
          </Badge>
        )}
      </div>

      {/* Row 2: Carousel Header (index/length helper and arrow buttons across from each other) */}
      {hasMultiple && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {counterText ? (
            <span className="text-xs font-semibold text-muted-foreground">
              {counterText}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <CarouselPrevious
              type="button"
              className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            />
            <CarouselNext
              type="button"
              className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            />
          </div>
        </div>
      )}
    </div>
  )
}
