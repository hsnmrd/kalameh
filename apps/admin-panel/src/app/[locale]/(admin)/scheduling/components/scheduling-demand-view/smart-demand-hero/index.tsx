"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarPlus, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface SmartDemandHeroProps {
  totalSuggestedClasses: number
  totalContinuingStudents: number
  totalNewPlacements: number
  totalEligibleStudents: number
  isLoading?: boolean
  onGenerateTimetable?: () => void
}

export function SmartDemandHero({
  totalSuggestedClasses,
  isLoading,
  onGenerateTimetable,
}: SmartDemandHeroProps) {
  const t = useTranslations("scheduling.demand.smartHero")
  const locale = useLocale()

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-foreground">
        <Sparkles className="size-7" aria-hidden />
      </div>

      <div className="flex max-w-xl flex-col items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="text-base text-muted-foreground sm:text-lg">
          {totalSuggestedClasses > 0
            ? t("subtitle", {
                count: formatNumber(totalSuggestedClasses, locale),
              })
            : t("noDemandSubtitle")}
        </p>
      </div>

      {onGenerateTimetable && (
        <Button
          type="button"
          onClick={onGenerateTimetable}
          disabled={isLoading || totalSuggestedClasses === 0}
          className="gap-2.5 px-8 font-semibold shadow-sm"
        >
          <CalendarPlus className="size-5" aria-hidden />
          <span>{t("generateButton")}</span>
        </Button>
      )}
    </div>
  )
}
