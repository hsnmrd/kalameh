"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Compass, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SetupFlowHeaderProps {
  completedCount: number
  totalSteps: number
  isExpanded: boolean
  onToggleExpand: () => void
}

export function SetupFlowHeader({
  completedCount,
  totalSteps,
  isExpanded,
  onToggleExpand,
}: SetupFlowHeaderProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const percent = Math.round((completedCount / totalSteps) * 100)
  const isAllDone = completedCount === totalSteps

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleExpand}
          className="h-9 cursor-pointer items-center gap-1.5 self-start rounded-xl text-xs sm:self-auto"
        >
          <span>{isExpanded ? t("hideDetails") : t("showDetails")}</span>
          {isExpanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
