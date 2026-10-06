"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  calculatePhaseSlots,
  isAvailabilityCoveringSlot,
  WEEK_DAYS,
  type TermDto,
  type TeacherAvailabilityInput,
  type WeekDay,
} from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { TermCard } from "./term-card"

export interface TermCarouselProps {
  terms: TermDto[]
  selectedTermId: string
  onSelectTerm: (termId: string) => void
  value: TeacherAvailabilityInput[]
  disabled?: boolean
}

export function TermCarousel({
  terms,
  selectedTermId,
  onSelectTerm,
  value,
  disabled = false,
}: TermCarouselProps) {
  const t = useTranslations("teachers.availabilities")

  const countsByTerm = React.useMemo(() => {
    const result: Record<string, number> = {}
    for (const term of terms) {
      if (!term.operatingPhase || !value || value.length === 0) {
        result[term.id] = 0
        continue
      }
      const pCalc = calculatePhaseSlots(
        term.operatingPhase.startTime,
        term.operatingPhase.endTime,
        term.operatingPhase.slotDurationMinutes,
        {
          hasBreak: term.operatingPhase.hasBreak,
          breakStartTime: term.operatingPhase.breakStartTime,
          breakEndTime: term.operatingPhase.breakEndTime,
        }
      )
      const pDays =
        term.operatingPhase.daysOfWeek &&
        term.operatingPhase.daysOfWeek.length > 0
          ? (term.operatingPhase.daysOfWeek as WeekDay[])
          : (WEEK_DAYS as unknown as WeekDay[])

      const termValue = value.filter((v) => !v.termId || v.termId === term.id)

      let count = 0
      for (const slot of pCalc.slots) {
        const isCoveredAcrossActiveDays =
          pDays.length > 0 &&
          pDays.some((day) =>
            termValue.some(
              (v) => v.dayOfWeek === day && isAvailabilityCoveringSlot(v, slot)
            )
          )
        if (isCoveredAcrossActiveDays) {
          count++
        }
      }

      result[term.id] = count
    }
    return result
  }, [terms, value])

  if (terms.length === 0) return null

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
      }}
      className="flex w-full flex-col gap-2.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {t("termCarouselTitle")}
        </span>
        {terms.length > 2 && (
          <div className="flex items-center gap-1">
            <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
            <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          </div>
        )}
      </div>

      <CarouselContent className="-ms-2.5">
        {terms.map((term) => (
          <CarouselItem
            key={term.id}
            className="basis-[82%] ps-2.5 sm:basis-[48%] md:basis-[40%]"
          >
            <TermCard
              term={term}
              isSelected={term.id === selectedTermId}
              availableClassesCount={countsByTerm[term.id] ?? 0}
              onSelect={onSelectTerm}
              disabled={disabled}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
