"use client"

import { useTranslations } from "next-intl"
import { Calendar, Clock, Edit2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import type { TeacherDto, WeekDay } from "@workspace/types"

interface AvailabilityScheduleProps {
  teacher: TeacherDto
  onClose: () => void
  onManage?: (teacher: TeacherDto) => void
}

export function AvailabilitySchedule({
  teacher,
  onClose,
  onManage,
}: AvailabilityScheduleProps) {
  const t = useTranslations("teachers")
  const availabilities = teacher.teacherProfile?.availabilities || []
  const handleManage = () => {
    onClose()
    onManage?.(teacher)
  }

  if (availabilities.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-muted-foreground" />
            <span>{t("profileModal.freeTimeSchedule")}</span>
          </h4>
          {onManage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleManage}
              className="h-8 gap-1.5 px-2 text-xs text-primary hover:text-primary"
            >
              <Clock className="size-3.5 text-primary" />
              <span>{t("table.setAvailability")}</span>
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("availabilities.noSlots")}
        </div>
      </div>
    )
  }

  return (
    <Carousel
      opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="size-4 text-muted-foreground" />
            <span>{t("profileModal.freeTimeSchedule")}</span>
          </h4>
          {onManage && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleManage}
              className="text-muted-foreground hover:text-foreground"
              title={t("actions.manageAvailability")}
              aria-label={t("actions.manageAvailability")}
            >
              <Edit2 className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
        </div>
      </div>
      <CarouselContent className="-ms-2.5">
        {availabilities.map((slot, index) => (
          <CarouselItem
            key={slot.id || index}
            className="basis-[80%] ps-2.5 sm:basis-1/2"
          >
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-colors hover:border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {t(`days.${slot.dayOfWeek as WeekDay}`)}
                </span>
              </div>
              <span
                className="font-mono text-xs font-medium text-muted-foreground"
                dir="ltr"
              >
                {slot.startTime} - {slot.endTime}
              </span>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
