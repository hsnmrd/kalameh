"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { JALALI_MONTHS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"

export interface MonthsSelectorProps {
  value: number[]
  onChange: (months: number[]) => void
  disabled?: boolean
  hasError?: boolean
}

interface SeasonConfig {
  key: "spring" | "summer" | "autumn" | "winter"
  nameFa: string
  nameEn: string
  monthIds: readonly number[]
  bgClass: string
  borderClass: string
  dotClass: string
}

const SEASONS: readonly SeasonConfig[] = [
  {
    key: "spring",
    nameFa: "بهار",
    nameEn: "Spring",
    monthIds: [1, 2, 3],
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/25",
    dotClass: "bg-emerald-500",
  },
  {
    key: "summer",
    nameFa: "تابستان",
    nameEn: "Summer",
    monthIds: [4, 5, 6],
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/25",
    dotClass: "bg-amber-500",
  },
  {
    key: "autumn",
    nameFa: "پاییز",
    nameEn: "Autumn",
    monthIds: [7, 8, 9],
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/25",
    dotClass: "bg-orange-500",
  },
  {
    key: "winter",
    nameFa: "زمستان",
    nameEn: "Winter",
    monthIds: [10, 11, 12],
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/25",
    dotClass: "bg-sky-500",
  },
]

export function MonthsSelector({
  value = [],
  onChange,
  disabled,
  hasError = false,
}: MonthsSelectorProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = React.useState(0)

  const isInvalid = Boolean(hasError && (!value || value.length === 0))

  const initialSeasonIndex = React.useRef(
    (() => {
      if (!value || value.length === 0) return 0
      const firstMonth = value[0]
      if (typeof firstMonth !== "number") return 0
      const idx = SEASONS.findIndex((s) => s.monthIds.includes(firstMonth))
      return idx >= 0 ? idx : 0
    })()
  ).current

  const toggleMonth = (monthId: number) => {
    if (disabled) return
    if (value.includes(monthId)) {
      onChange(value.filter((m) => m !== monthId))
    } else {
      onChange([...value, monthId].sort((a, b) => a - b))
    }
  }

  React.useEffect(() => {
    if (!api) return

    setCurrentSlide(api.selectedScrollSnap())

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <div className="flex flex-col gap-2">
      {/* Seasons Carousel: Each season takes 80% width */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          startIndex: initialSeasonIndex,
        }}
        className="w-full"
      >
        <CarouselContent className="-ms-2.5">
          {SEASONS.map((season) => {
            const seasonMonths = JALALI_MONTHS.filter((m) =>
              season.monthIds.includes(m.id)
            )
            const selectedInSeasonCount = season.monthIds.filter((id) =>
              value.includes(id)
            ).length

            return (
              <CarouselItem
                key={season.key}
                data-slot="season-item"
                className="shrink-0 basis-[80%] ps-2.5"
              >
                <div
                  className={cn(
                    "flex flex-col gap-2.5 rounded-2xl border p-3 transition-colors",
                    season.bgClass,
                    season.borderClass
                  )}
                >
                  {/* Season Header: Season name shown once, outside month items */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn("size-2 rounded-full", season.dotClass)}
                      />
                      <span className="text-xs font-bold text-foreground">
                        {season.nameFa}
                      </span>
                    </div>

                    {selectedInSeasonCount > 0 && (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {selectedInSeasonCount}/۳
                      </span>
                    )}
                  </div>

                  {/* 3 Months sharing equal width */}
                  <div className="grid grid-cols-3 gap-2">
                    {seasonMonths.map((m) => {
                      const isSelected = value.includes(m.id)
                      return (
                        <Button
                          key={m.id}
                          type="button"
                          disabled={disabled}
                          aria-invalid={isInvalid ? "true" : undefined}
                          onClick={() => toggleMonth(m.id)}
                          className={cn(
                            "h-12 w-full cursor-pointer items-center justify-center gap-1 rounded-xl px-1.5 text-center text-xs font-bold shadow-2xs transition-all sm:gap-1.5 sm:px-2 sm:text-sm",
                            isSelected
                              ? "bg-primary font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                              : isInvalid
                                ? "border-destructive/80 bg-destructive/5 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                                : "border-border/60 bg-background/90 text-foreground hover:border-foreground/30 hover:bg-background"
                          )}
                        >
                          {isSelected && (
                            <Check className="size-3.5 shrink-0" />
                          )}
                          <span className="truncate">{m.nameFa}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Season Slide Indicators (Tabs) */}
      <div
        role="tablist"
        aria-label="فصل‌ها"
        className="flex items-center justify-center gap-1.5 pt-1"
      >
        {SEASONS.map((s, idx) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={currentSlide === idx}
            aria-label={s.nameFa}
            onClick={() => api?.scrollTo(idx)}
            className={cn(
              "h-1.5 cursor-pointer rounded-full border-0 p-0 transition-all",
              currentSlide === idx
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            )}
          />
        ))}
      </div>
    </div>
  )
}
