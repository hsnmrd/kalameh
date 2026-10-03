"use client"

import * as React from "react"
import type { PhaseGeneratedSlot, WeekDay } from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { SlotChip } from "../../slot-chip"

export interface SlotCarouselProps {
  trackTitle: string
  slots: PhaseGeneratedSlot[]
  days: WeekDay[]
  isSlotSelected: (slot: PhaseGeneratedSlot) => boolean
  onToggleSlot: (days: WeekDay[], slot: PhaseGeneratedSlot) => void
  disabled?: boolean
}

export function SlotCarousel({
  trackTitle,
  slots,
  days,
  isSlotSelected,
  onToggleSlot,
  disabled = false,
}: SlotCarouselProps) {
  if (slots.length === 0) return null

  return (
    <Carousel
      opts={{
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
      }}
      className="w-full"
    >
      <div className="flex w-full items-center gap-1.5">
        {slots.length > 4 && (
          <CarouselPrevious className="static size-7 shrink-0 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 p-0 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
        )}
        <div className="min-w-0 flex-1">
          <CarouselContent>
            {slots.map((slot) => (
              <CarouselItem
                key={`${trackTitle}-${slot.slotNumber}-${slot.startTime}`}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4"
              >
                <SlotChip
                  slotNumber={slot.slotNumber}
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  isSelected={isSlotSelected(slot)}
                  onToggle={() => onToggleSlot(days, slot)}
                  disabled={disabled}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
        {slots.length > 4 && (
          <CarouselNext className="static size-7 shrink-0 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 p-0 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
        )}
      </div>
    </Carousel>
  )
}
