"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  calculatePhaseSlots,
  WEEK_DAYS,
  type OperatingPhaseWithSlots,
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
import { PhaseCard } from "./phase-card"

export interface PhaseCarouselProps {
  phases: OperatingPhaseWithSlots[]
  selectedPhaseId: string
  onSelectPhase: (phaseId: string) => void
  value: TeacherAvailabilityInput[]
  disabled?: boolean
}

export function PhaseCarousel({
  phases,
  selectedPhaseId,
  onSelectPhase,
  value,
  disabled = false,
}: PhaseCarouselProps) {
  const t = useTranslations("teachers.availabilities")

  const countsByPhase = React.useMemo(() => {
    const result: Record<string, number> = {}
    for (const phase of phases) {
      if (!value || value.length === 0) {
        result[phase.id] = 0
        continue
      }
      const pCalc = calculatePhaseSlots(
        phase.startTime,
        phase.endTime,
        phase.slotDurationMinutes,
        {
          hasBreak: phase.hasBreak,
          breakStartTime: phase.breakStartTime,
          breakEndTime: phase.breakEndTime,
        }
      )
      const pDays =
        phase.daysOfWeek && phase.daysOfWeek.length > 0
          ? phase.daysOfWeek
          : (WEEK_DAYS as unknown as WeekDay[])

      const count = value.filter((v) => {
        if (!pDays.includes(v.dayOfWeek as WeekDay)) return false
        return pCalc.slots.some(
          (s) => s.startTime === v.startTime && s.endTime === v.endTime
        )
      }).length

      result[phase.id] = count
    }
    return result
  }, [phases, value])

  if (phases.length === 0) return null

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
          {t("phaseCarouselTitle")}
        </span>
        {phases.length > 2 && (
          <div className="flex items-center gap-1">
            <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
            <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          </div>
        )}
      </div>

      <CarouselContent className="-ms-2.5">
        {phases.map((phase) => (
          <CarouselItem
            key={phase.id}
            className="basis-[82%] ps-2.5 sm:basis-[48%] md:basis-[40%]"
          >
            <PhaseCard
              phase={phase}
              isSelected={phase.id === selectedPhaseId}
              availableClassesCount={countsByPhase[phase.id] ?? 0}
              onSelect={onSelectPhase}
              disabled={disabled}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
