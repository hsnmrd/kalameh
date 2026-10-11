"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Compass } from "lucide-react"

export interface SetupFlowHeaderProps {
  completedCount?: number
  totalSteps?: number
  actions?: React.ReactNode
}

export function SetupFlowHeader({ actions }: SetupFlowHeaderProps) {
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

      {actions && (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      )}
    </div>
  )
}
