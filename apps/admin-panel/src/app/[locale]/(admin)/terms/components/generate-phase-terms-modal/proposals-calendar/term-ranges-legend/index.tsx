"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { GeneratedTermProposal } from "@workspace/types"
import { getTermColorTheme } from "../helper/calendar-colors"

export interface TermRangesLegendProps {
  proposals: GeneratedTermProposal[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

export function TermRangesLegend({
  proposals,
  selectedIndex,
  onSelectIndex,
}: TermRangesLegendProps) {
  const t = useTranslations("terms")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!api) return
    api.scrollTo(selectedIndex)
  }, [api, selectedIndex])

  return (
    <div className="relative w-full px-6 sm:px-9">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className="-ms-2 items-stretch sm:-ms-2.5">
          {proposals.map((term, idx) => {
            const theme = getTermColorTheme(idx)
            const isSelected = idx === selectedIndex

            return (
              <CarouselItem
                key={idx}
                className="flex basis-1/2 ps-2 sm:basis-1/2 sm:ps-2.5 lg:basis-1/3 xl:basis-1/4"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSelectIndex(idx)}
                  className={cn(
                    "group relative flex h-full w-full cursor-pointer flex-col items-start justify-between gap-2 rounded-xl border-2 p-2.5 text-start font-normal whitespace-normal shadow-none transition-all select-none sm:rounded-2xl sm:p-3",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30 hover:bg-primary/10"
                      : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full sm:size-2.5",
                          theme.dotColor
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[11px] font-bold sm:text-xs",
                          isSelected
                            ? "font-extrabold text-primary"
                            : "text-foreground"
                        )}
                      >
                        {term.title}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-semibold transition-colors sm:text-xs",
                        isSelected
                          ? "font-bold text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {t("batchModal.daysBadge", {
                        count: formatNumber(term.daysCount, locale),
                      })}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-1 text-[11px] text-muted-foreground sm:text-xs">
                    <div className="flex items-center gap-1 font-medium sm:gap-1.5">
                      <CalendarIcon className="size-3 shrink-0 text-muted-foreground sm:size-3.5" />
                      <span className="truncate">
                        {term.startDateJalali} تا {term.endDateJalali}
                      </span>
                    </div>

                    <div className="flex min-h-[16px] items-center sm:min-h-[18px]">
                      {term.holidaysCount > 0 ? (
                        <span className="text-[10px] font-medium text-destructive sm:text-[11px]">
                          {t("batchModal.holidaysCountBadge", {
                            count: formatNumber(term.holidaysCount, locale),
                          })}
                        </span>
                      ) : (
                        <span className="pointer-events-none invisible text-[10px] select-none sm:text-[11px]">
                          &nbsp;
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className="-start-5 size-7 sm:-start-8 sm:size-8" />
        <CarouselNext className="-end-5 size-7 sm:-end-8 sm:size-8" />
      </Carousel>
    </div>
  )
}
