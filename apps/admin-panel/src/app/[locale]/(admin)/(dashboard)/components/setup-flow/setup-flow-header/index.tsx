"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Compass } from "lucide-react"

export interface SetupFlowHeaderProps {
  completedCount?: number
  totalSteps?: number
  actions?: React.ReactNode
}

export function SetupFlowHeader({
  completedCount,
  totalSteps,
  actions,
}: SetupFlowHeaderProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Compass className="size-4" />
        </div>
        <h2 className="text-sm font-semibold text-foreground sm:text-base">
          {t("title")}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {completedCount !== undefined && totalSteps !== undefined && (
          <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
            {completedCount} / {totalSteps}
          </span>
        )}
        {actions}
      </div>
    </div>
  )
}
