"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Sparkles, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"
import { WEEK_DAYS, type WeekDay } from "@workspace/types"
import { PRESETS } from "@/data"

const SHORT_DAY_NAMES: Record<WeekDay, { fa: string; en: string }> = {
  SATURDAY: { fa: "ش", en: "Sa" },
  SUNDAY: { fa: "ی", en: "Su" },
  MONDAY: { fa: "د", en: "Mo" },
  TUESDAY: { fa: "س", en: "Tu" },
  WEDNESDAY: { fa: "چ", en: "We" },
  THURSDAY: { fa: "پ", en: "Th" },
  FRIDAY: { fa: "ج", en: "Fr" },
}

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
  const locale = useLocale()
  const isFa = locale === "fa"

  return (
    <div className="space-y-3.5">
      {/* Quick Presets with Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-muted-foreground" />
          <span>{t("presets")}</span>
        </div>
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          <CarouselContent className="-ms-2">
            {PRESETS.map((preset) => {
              const isActive =
                preset.days.length === selectedDays.length &&
                preset.days.every((d) => selectedDays.includes(d))

              return (
                <CarouselItem key={preset.id} className="basis-auto ps-2">
                  <Button
                    type="button"
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onApplyPreset(preset.days)}
                    className={cn(
                      "h-8 shrink-0 justify-center rounded-xl px-3 text-xs font-medium transition-colors",
                      isActive
                        ? "border border-primary/40 bg-primary/10 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive && <Check className="me-1 size-3 text-primary" />}
                    <span className="whitespace-nowrap">
                      {t(preset.titleKey)}
                    </span>
                  </Button>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Weekday Selection (Separate Title and 7-Column Row) */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">
          {t("weekdays")}
        </label>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEK_DAYS.map((day) => {
            const isSelected = selectedDays.includes(day)
            const shortName = isFa
              ? SHORT_DAY_NAMES[day].fa
              : SHORT_DAY_NAMES[day].en

            return (
              <Button
                key={day}
                type="button"
                variant={isSelected ? "default" : "outline"}
                aria-label={t(`days.${day}`)}
                onClick={() => onToggleDay(day)}
                className={cn(
                  "h-10 w-full min-w-0 rounded-xl p-0 text-center transition-all select-none",
                  isSelected
                    ? "bg-primary font-bold text-primary-foreground shadow-xs"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <span className="text-xs font-bold sm:hidden">{shortName}</span>
                <span className="hidden text-xs sm:inline">
                  {t(`days.${day}`)}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
