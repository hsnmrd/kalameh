"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GitBranch } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface SchedulingStaffingOrDividerProps {
  className?: string
}

export function SchedulingStaffingOrDivider({
  className,
}: SchedulingStaffingOrDividerProps) {
  const t = useTranslations("scheduling.planDetails.staffingFallback")

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative my-4 flex items-center justify-center",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-3 py-1 text-xs font-bold text-muted-foreground shadow-2xs">
        <GitBranch
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <span>{t("orDivider")}</span>
      </div>
    </div>
  )
}
