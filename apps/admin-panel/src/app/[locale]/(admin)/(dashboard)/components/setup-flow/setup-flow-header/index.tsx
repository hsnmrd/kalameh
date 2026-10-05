"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Compass } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SetupFlowHeaderProps {
  completedCount: number
  totalSteps: number
  actions?: React.ReactNode
}

export function SetupFlowHeader({
  completedCount,
  totalSteps,
  actions,
}: SetupFlowHeaderProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const percent = Math.round((completedCount / totalSteps) * 100)
  const isAllDone = completedCount === totalSteps

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                {t("title")}
              </h2>
              <Badge
                variant={isAllDone ? "success" : "default"}
                className="text-[11px]"
              >
                {t("progressLabel", {
                  percent: formatNumber(percent),
                  completed: formatNumber(completedCount),
                  total: formatNumber(totalSteps),
                })}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {actions}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
