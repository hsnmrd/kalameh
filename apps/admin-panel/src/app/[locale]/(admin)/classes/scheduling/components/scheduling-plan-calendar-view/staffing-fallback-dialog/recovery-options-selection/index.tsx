"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock } from "lucide-react"
import type { SchedulingRecoveryOption } from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingStaffingSectionHeader } from "../../../scheduling-staffing-section-header"
import { RecoveryOptionCard } from "./recovery-option-card"

export interface RecoveryOptionsSelectionProps {
  branchNumber?: number
  options: SchedulingRecoveryOption[]
  canApply: boolean
  isPending?: boolean
  onApply: (option: SchedulingRecoveryOption) => Promise<void> | void
}

export function RecoveryOptionsSelection({
  branchNumber,
  options,
  canApply,
  isPending = false,
  onApply,
}: RecoveryOptionsSelectionProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)
  const [applyingKey, setApplyingKey] = React.useState<string | null>(null)

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

  const handleApply = async (option: SchedulingRecoveryOption) => {
    if (!canApply || isPending) return
    setApplyingKey(option.key)
    try {
      await onApply(option)
    } finally {
      setApplyingKey(null)
    }
  }

  if (options.length === 0) {
    return null
  }

  const hasMultiple = options.length > 1

  return (
    <section
      data-testid="recovery-options-selection"
      className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-colors sm:p-5"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          direction: locale === "fa" ? "rtl" : "ltr",
        }}
        className="w-full"
      >
        <SchedulingStaffingSectionHeader
          branchNumber={branchNumber}
          icon={CalendarClock}
          title={t("recovery.rescheduleTitle")}
          badgeLabel={
            options.length > 0
              ? t("recovery.suggestionsCount", {
                  count: formatNumber(options.length, locale),
                })
              : null
          }
          badgeVariant="outline"
          badgeClassName="border-primary/40 bg-primary/10 text-primary"
          total={options.length}
          counterText={t("recovery.carouselCounter", {
            current: formatNumber(current, locale),
            total: formatNumber(options.length, locale),
          })}
        />

        <CarouselContent className="-ms-3 mt-3">
          {options.map((option) => (
            <CarouselItem
              key={option.key}
              data-testid="recovery-option-slide"
              className={cn(
                "ps-3",
                hasMultiple ? "basis-[90%] sm:basis-[85%]" : "basis-full"
              )}
            >
              <RecoveryOptionCard
                option={option}
                canApply={canApply}
                isPending={isPending}
                isApplying={applyingKey === option.key}
                onApply={handleApply}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
