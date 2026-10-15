"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Calendar, Check, Clock, Edit2, X } from "lucide-react"
import {
  calculatePhaseSlots,
  isOperatingPhaseCurrent,
  WEEK_DAYS,
  type PhaseGeneratedSlot,
  type StudentDto,
  type WeekDay,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface StudentScheduleTabProps {
  student: StudentDto
  onManageAvailability: () => void
}

export function StudentScheduleTab({
  student,
  onManageAvailability,
}: StudentScheduleTabProps) {
  const t = useTranslations("students")
  const { activeInstituteId } = useActiveInstitute()
  const effectiveInstituteId = student.instituteId || activeInstituteId
  const availabilities = student.studentProfile?.availabilities || []

  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery(
      effectiveInstituteId ? { instituteId: effectiveInstituteId } : undefined
    ),
    enabled: Boolean(effectiveInstituteId),
  })

  const activePhases = React.useMemo(
    () => phases.filter((p) => p.isActive),
    [phases]
  )

  const defaultPhase = React.useMemo(() => {
    return (
      activePhases.find((p) => isOperatingPhaseCurrent(p)) ||
      activePhases[0] ||
      phases[0] ||
      null
    )
  }, [activePhases, phases])

  const [selectedPhaseId, setSelectedPhaseId] = React.useState<string | null>(
    null
  )

  const currentPhase = React.useMemo(() => {
    const id = selectedPhaseId || defaultPhase?.id
    return phases.find((p) => p.id === id) || defaultPhase
  }, [selectedPhaseId, defaultPhase, phases])

  const standardSlots = React.useMemo<PhaseGeneratedSlot[]>(() => {
    if (currentPhase) {
      const calc = calculatePhaseSlots(
        currentPhase.startTime,
        currentPhase.endTime,
        currentPhase.slotDurationMinutes,
        {
          hasBreak: currentPhase.hasBreak,
          breakStartTime: currentPhase.breakStartTime,
          breakEndTime: currentPhase.breakEndTime,
        }
      )
      if (calc.slots.length > 0) return calc.slots
    }

    // Fallback: collect unique slots from student availabilities
    const uniqueMap = new Map<string, { startTime: string; endTime: string }>()
    for (const a of availabilities) {
      const key = `${a.startTime}-${a.endTime}`
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { startTime: a.startTime, endTime: a.endTime })
      }
    }
    const derived = Array.from(uniqueMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
    return derived.map((s, idx) => ({
      slotNumber: idx + 1,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMinutes: 90,
    }))
  }, [currentPhase, availabilities])

  const daysToShow = React.useMemo<WeekDay[]>(() => {
    if (currentPhase?.daysOfWeek && currentPhase.daysOfWeek.length > 0) {
      return (WEEK_DAYS as readonly WeekDay[]).filter((d) =>
        currentPhase.daysOfWeek.includes(d)
      )
    }
    const daysWithAvailabilities = new Set(
      availabilities.map((a) => a.dayOfWeek as WeekDay)
    )
    const filtered = (WEEK_DAYS as readonly WeekDay[]).filter((d) =>
      daysWithAvailabilities.has(d)
    )
    return filtered.length > 0 ? filtered : [...WEEK_DAYS]
  }, [currentPhase, availabilities])

  const [selectedDayFilter, setSelectedDayFilter] = React.useState<
    WeekDay | "ALL"
  >("ALL")

  const filteredDays = React.useMemo(() => {
    if (selectedDayFilter === "ALL") return daysToShow
    return daysToShow.filter((d) => d === selectedDayFilter)
  }, [daysToShow, selectedDayFilter])

  const isSlotAvailable = React.useCallback(
    (day: WeekDay, slot: PhaseGeneratedSlot) => {
      return availabilities.some(
        (a) =>
          a.dayOfWeek === day &&
          (!currentPhase?.id ||
            !a.operatingPhaseId ||
            a.operatingPhaseId === currentPhase.id) &&
          a.startTime === slot.startTime &&
          a.endTime === slot.endTime
      )
    },
    [availabilities, currentPhase]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header section without total count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-foreground" />
          <h4 className="text-sm font-bold text-foreground sm:text-base">
            <span>{t("availabilities.title")}</span>
          </h4>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onManageAvailability}
          className="h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold"
        >
          <Edit2 className="size-3.5 text-muted-foreground" />
          <span>{t("actions.availability")}</span>
        </Button>
      </div>

      {/* Phase Selector (when multiple active phases exist) */}
      {activePhases.length > 1 && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {t("availabilities.phase")}
          </span>
          {activePhases.map((phase) => (
            <Button
              key={phase.id}
              type="button"
              size="sm"
              variant={currentPhase?.id === phase.id ? "secondary" : "ghost"}
              onClick={() => setSelectedPhaseId(phase.id)}
              className="h-8 rounded-xl px-3 text-xs font-medium"
            >
              {phase.title}
            </Button>
          ))}
        </div>
      )}

      {/* Day Filter bar (allows focusing on a single day or all days) */}
      {daysToShow.length > 1 && (
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            type="button"
            size="sm"
            variant={selectedDayFilter === "ALL" ? "secondary" : "ghost"}
            onClick={() => setSelectedDayFilter("ALL")}
            className="h-8 rounded-xl px-3 text-xs font-medium"
          >
            {t("availabilities.filterAllDays")}
          </Button>
          {daysToShow.map((day) => (
            <Button
              key={day}
              type="button"
              size="sm"
              variant={selectedDayFilter === day ? "secondary" : "ghost"}
              onClick={() => setSelectedDayFilter(day)}
              className="h-8 rounded-xl px-3 text-xs font-medium"
            >
              {t(`days.${day}`)}
            </Button>
          ))}
        </div>
      )}

      {/* Empty State when no availabilities exist */}
      {availabilities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-xs text-muted-foreground">
          <p>{t("availabilities.empty")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageAvailability}
            className="mt-3 gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{t("availabilities.setAvailability")}</span>
          </Button>
        </div>
      ) : (
        /* Days List with Carousel for all classes/slots */
        <div className="flex flex-col gap-4">
          {filteredDays.map((day) => {
            const availableCount = standardSlots.filter((slot) =>
              isSlotAvailable(day, slot)
            ).length

            return (
              <Carousel
                key={day}
                opts={{
                  align: "start",
                  dragFree: true,
                  containScroll: "trimSnaps",
                }}
                className="w-full"
              >
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-2xs sm:p-4">
                  {/* Card Header with localized Day Title & Carousel Navigation */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="size-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        {t(`days.${day}`)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("availabilities.classesRatio", {
                          available: availableCount,
                          total: standardSlots.length,
                        })}
                      </span>
                      {standardSlots.length > 3 && (
                        <div className="hidden items-center gap-1 sm:flex">
                          <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/70 bg-background/80 shadow-none hover:bg-muted" />
                          <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/70 bg-background/80 shadow-none hover:bg-muted" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Carousel of All Available Classes / Slots */}
                  <CarouselContent className="-ms-2">
                    {standardSlots.map((slot) => {
                      const available = isSlotAvailable(day, slot)

                      return (
                        <CarouselItem
                          key={`${day}-${slot.slotNumber}-${slot.startTime}`}
                          className="basis-[68%] ps-2 sm:basis-[45%] md:basis-[32%] lg:basis-[24%]"
                        >
                          <div
                            className={cn(
                              "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
                              available
                                ? "border-border/80 bg-background text-foreground shadow-2xs"
                                : "border-dashed border-border/60 bg-muted/20 text-muted-foreground opacity-65"
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-foreground">
                                {t("availabilities.classLabel", {
                                  slotNumber: slot.slotNumber,
                                })}
                              </span>

                              {available ? (
                                <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                                  <Check
                                    className="size-3 stroke-[2.5] text-success"
                                    aria-hidden
                                  />
                                  <span>{t("availabilities.available")}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  <X
                                    className="size-3 stroke-[2.5] text-muted-foreground"
                                    aria-hidden
                                  />
                                  <span>{t("availabilities.unavailable")}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                              <Clock
                                className="size-3 shrink-0 text-muted-foreground"
                                aria-hidden
                              />
                              <span
                                dir="ltr"
                                className="inline-block font-medium text-foreground"
                              >
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                          </div>
                        </CarouselItem>
                      )
                    })}
                  </CarouselContent>
                </div>
              </Carousel>
            )
          })}
        </div>
      )}
    </div>
  )
}
