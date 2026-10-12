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
  lockedTermIndex?: number
  dateConflicts?: Array<{
    termTitle: string
    conflictingTitle: string
    termIndex: number
  }>
}

export function TermRangesLegend({
  proposals,
  selectedIndex,
  onSelectIndex,
  lockedTermIndex,
  dateConflicts,
}: TermRangesLegendProps) {
  const t = useTranslations("terms")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (!api) return
    api.scrollTo(selectedIndex)
  }, [api, selectedIndex])

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
        }}
        className="flex w-full flex-col gap-2.5"
      >
        {/* Header: Title and navigation controls across each other */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              {t("batchModal.carouselTitle")}
            </h4>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {formatNumber(proposals.length, locale)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CarouselPrevious className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
            <CarouselNext className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          </div>
        </div>

        <CarouselContent className="-ms-2 items-stretch sm:-ms-2.5">
          {proposals.map((term, idx) => {
            const theme = getTermColorTheme(idx)
            const isSelected = idx === selectedIndex
            const isLockedOut =
              lockedTermIndex !== undefined && idx !== lockedTermIndex
            const conflictsForTerm = dateConflicts?.filter(
              (c) => c.termIndex === idx || c.termTitle === term.title
            )
            const hasConflict = Boolean(
              conflictsForTerm && conflictsForTerm.length > 0
            )
            const hasImbalance = Boolean(term.hasSessionImbalance)
            const isDestructive = hasImbalance || hasConflict

            return (
              <CarouselItem
                key={idx}
                className="flex basis-1/2 ps-2 sm:basis-1/2 sm:ps-2.5 lg:basis-1/3 xl:basis-1/4"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!isLockedOut) {
                      onSelectIndex(idx)
                    }
                  }}
                  className={cn(
                    "group relative flex h-full w-full flex-col items-start justify-between gap-2 rounded-xl border-2 p-2.5 text-start font-normal whitespace-normal shadow-none transition-all select-none sm:rounded-2xl sm:p-3",
                    isLockedOut
                      ? "cursor-default border-dashed border-border/60 bg-muted/20 opacity-60 hover:border-border/60 hover:bg-muted/20"
                      : isDestructive
                        ? isSelected
                          ? "cursor-pointer border-destructive bg-destructive/10 shadow-xs ring-1 ring-destructive/40 hover:bg-destructive/15"
                          : "cursor-pointer border-destructive/60 bg-destructive/5 hover:border-destructive hover:bg-destructive/10"
                        : isSelected
                          ? "cursor-pointer border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30 hover:bg-primary/10"
                          : "cursor-pointer border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full sm:size-2.5",
                          isDestructive ? "bg-destructive" : theme.dotColor
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[11px] font-bold sm:text-xs",
                          isDestructive
                            ? "font-extrabold text-destructive"
                            : isSelected
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
                        isDestructive
                          ? "font-bold text-destructive"
                          : isSelected
                            ? "font-bold text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {t("batchModal.sessionsBadge", {
                        count: formatNumber(term.sessionsCount ?? 18, locale),
                      })}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-1 text-[11px] text-muted-foreground sm:text-xs">
                    <div className="flex items-center justify-between gap-1 font-medium sm:gap-1.5">
                      <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                        <CalendarIcon className="size-3 shrink-0 text-muted-foreground sm:size-3.5" />
                        <span className="truncate">
                          {term.startDateJalali} تا {term.endDateJalali}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground sm:text-[11px]">
                        (
                        {t("batchModal.daysBadge", {
                          count: formatNumber(term.daysCount, locale),
                        })}
                        )
                      </span>
                    </div>

                    {isLockedOut && (
                      <div className="mt-1 flex items-center">
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                          {t("batchModal.referenceTermBadge")}
                        </span>
                      </div>
                    )}
                  </div>
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
