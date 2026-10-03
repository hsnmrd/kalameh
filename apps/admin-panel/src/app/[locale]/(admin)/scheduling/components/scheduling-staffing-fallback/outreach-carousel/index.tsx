"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import type { SchedulingTeacherOutreachOption } from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { OutreachOptionItem } from "../outreach-option-item"

export interface OutreachCarouselProps {
  options: SchedulingTeacherOutreachOption[]
  canToggle: boolean
  isPending: (key: string) => boolean
  pendingAction?: "ACCEPT" | "REJECT" | null
  onToggle: (
    option: SchedulingTeacherOutreachOption,
    action: "ACCEPT" | "REJECT"
  ) => void
}

export function OutreachCarousel({
  options,
  canToggle,
  isPending,
  pendingAction,
  onToggle,
}: OutreachCarouselProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap() + 1)

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1)
    }

    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  if (options.length === 0) return null

  const hasMultiple = options.length > 1

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          direction: locale === "fa" ? "rtl" : "ltr",
        }}
        className="w-full"
      >
        {hasMultiple && (
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("staffingFallback.carouselCounter", {
                current: formatNumber(current, locale),
                total: formatNumber(options.length, locale),
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <CarouselPrevious
                type="button"
                className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              />
              <CarouselNext
                type="button"
                className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              />
            </div>
          </div>
        )}

        <CarouselContent className="-ms-3">
          {options.map((option, index) => (
            <CarouselItem
              key={option.key}
              className={cn("ps-3", hasMultiple ? "basis-[90%]" : "basis-full")}
            >
              <OutreachOptionItem
                option={option}
                index={index}
                canToggle={canToggle}
                isPending={isPending(option.key)}
                pendingAction={isPending(option.key) ? pendingAction : null}
                onToggle={onToggle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
