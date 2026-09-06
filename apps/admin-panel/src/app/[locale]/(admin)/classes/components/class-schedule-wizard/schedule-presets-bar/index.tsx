"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { WEEK_DAYS, type WeekDay } from "@workspace/types"
import { PRESETS } from "@/data"

export interface SchedulePresetsBarProps {
  selectedDays: WeekDay[]
  onApplyPreset: (days: WeekDay[]) => void
  onToggleDay: (day: WeekDay) => void
}

export function SchedulePresetsBar({
  selectedDays,
  onApplyPreset,
  onToggleDay,
}: SchedulePresetsBarProps) {
  const t = useTranslations("classes.scheduleWizard")

  return (
    <>
      {/* Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-muted-foreground" />
          <span>{t("presets")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive =
              preset.days.length === selectedDays.length &&
              preset.days.every((d) => selectedDays.includes(d))

            return (
              <Button
                key={preset.id}
                type="button"
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                onClick={() => onApplyPreset(preset.days)}
                className={cn(
                  "h-8 rounded-xl text-xs transition-colors",
                  isActive &&
                    "border-primary/50 bg-primary/10 font-medium text-primary"
                )}
              >
                {isActive && <Check className="size-3 text-primary" />}
                <span>{t(preset.titleKey)}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Weekday Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">
          {t("weekdays")}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {WEEK_DAYS.map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <Button
                key={day}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleDay(day)}
                className={cn(
                  "h-10 rounded-xl text-xs font-normal transition-all",
                  isSelected && "font-semibold shadow-xs"
                )}
              >
                {t(`days.${day}`)}
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
