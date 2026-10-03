"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { UserCheck } from "lucide-react"
import type { SchedulingTeacherCalendar, WeekDay } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import type {
  FreeTeacherSwapTarget,
  SwapEvaluationResult,
} from "../scheduling-plan-calendar-view/helper/swap-eligibility.helper"

export interface GroupTeacherAccessibilityItem {
  teacher: SchedulingTeacherCalendar["teacher"]
  status: "AVAILABLE" | "TEACHING" | "UNAVAILABLE"
  teachingClassTitle?: string | null
  levelRange?: string | null
  suggestedCourseTitle?: string | null
  swapTarget?: FreeTeacherSwapTarget | null
  swapEvaluation?: SwapEvaluationResult | null
  isSwappable?: boolean
  isDimmed?: boolean
  isSelected?: boolean
}

export interface SchedulingPlanCalendarGroupTeachersCarouselProps {
  track: WeekDay | "EVEN" | "ODD"
  slotKey: string
  teachers: GroupTeacherAccessibilityItem[]
  isCollapsed?: boolean
  onSelectTeacher?: (teacherId: string) => void
  onSwapWithTeacher?: (
    target: FreeTeacherSwapTarget,
    evaluation: SwapEvaluationResult
  ) => void
  className?: string
}

export function SchedulingPlanCalendarGroupTeachersCarousel({
  track,
  slotKey,
  teachers,
  isCollapsed = false,
  onSelectTeacher,
  onSwapWithTeacher,
  className,
}: SchedulingPlanCalendarGroupTeachersCarouselProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  if (teachers.length === 0) return null

  return (
    <div
      data-testid={`group-teachers-carousel-${track}-${slotKey}`}
      className={cn(
        "mt-2 flex flex-col gap-1.5 border-t border-border/40 pt-2",
        className
      )}
    >
      <Carousel
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          direction: locale === "fa" ? "rtl" : "ltr",
        }}
        className="w-full"
      >
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserCheck
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="text-[11px] font-bold text-foreground">
              {t("calendarView.mastersAccessibility")}
            </span>
            <Badge
              variant="secondary"
              data-testid={`group-teachers-count-badge-${track}-${slotKey}`}
              className="h-4 px-1.5 py-0 text-[10px]"
            >
              {t("calendarView.groupTeachersCount", {
                count: formatNumber(teachers.length, locale),
              })}
            </Badge>
          </div>
          {teachers.length > 1 && (
            <div className="flex items-center gap-1">
              <CarouselPrevious
                type="button"
                className="static size-6 translate-x-0 translate-y-0 scale-100 rounded-md border-border/80 bg-muted/40 p-0 text-muted-foreground opacity-100 shadow-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              />
              <CarouselNext
                type="button"
                className="static size-6 translate-x-0 translate-y-0 scale-100 rounded-md border-border/80 bg-muted/40 p-0 text-muted-foreground opacity-100 shadow-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              />
            </div>
          )}
        </div>

        <CarouselContent className="-ms-2">
          {teachers.map((item) => {
            const teacherName =
              `${item.teacher.firstName} ${item.teacher.lastName}`.trim()
            const subtitle =
              item.status === "TEACHING"
                ? (item.teachingClassTitle ?? t("calendarView.teacherTeaching"))
                : (item.suggestedCourseTitle ??
                  item.levelRange ??
                  t("calendarView.teacherAccessible"))

            return (
              <CarouselItem
                key={item.teacher.id}
                className="basis-[165px] ps-2 sm:basis-[185px]"
              >
                <Button
                  variant="ghost"
                  data-testid={`group-teacher-card-${item.teacher.id}-${track}-${slotKey}`}
                  data-selected={item.isSelected ? "true" : undefined}
                  data-status={item.status}
                  data-swappable={item.isSwappable ? "true" : undefined}
                  onClick={() => {
                    if (
                      item.isSwappable &&
                      item.swapEvaluation &&
                      item.swapTarget
                    ) {
                      onSwapWithTeacher?.(item.swapTarget, item.swapEvaluation)
                    } else if (onSelectTeacher) {
                      onSelectTeacher(item.teacher.id)
                    }
                  }}
                  className={cn(
                    "group relative flex h-auto w-full flex-col items-stretch justify-between gap-1.5 overflow-hidden rounded-xl border p-2 text-start shadow-2xs transition-all duration-200 select-none",
                    item.isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/60"
                      : item.status === "AVAILABLE"
                        ? "border-success/40 bg-success/5 hover:border-success/70 hover:bg-success/10"
                        : "border-border/60 bg-background/80 hover:border-border hover:bg-muted/40",
                    item.isSwappable &&
                      "animate-calendar-card-shake ring-2 ring-primary/60",
                    item.isDimmed &&
                      "opacity-30 grayscale hover:opacity-70 hover:grayscale-0",
                    isCollapsed && "gap-1 p-1.5"
                  )}
                  aria-label={`${teacherName} - ${
                    item.status === "AVAILABLE"
                      ? t("calendarView.availableBadge")
                      : item.status === "TEACHING"
                        ? t("calendarView.teachingBadge")
                        : t("calendarView.unavailableBadge")
                  }`}
                >
                  {/* Top Row: Avatar & Name */}
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                      {item.teacher.avatarUrl ? (
                        <Image
                          src={getAssetUrl(item.teacher.avatarUrl)}
                          alt={teacherName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {item.teacher.firstName[0]}
                        </div>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {teacherName}
                    </span>
                  </div>

                  {/* Bottom Row: Status Badge & Subtitle */}
                  <div className="flex min-w-0 items-center justify-between gap-1 pt-0.5">
                    {item.status === "AVAILABLE" ? (
                      <Badge
                        variant="outline"
                        data-testid={`teacher-status-badge-${item.teacher.id}-${track}-${slotKey}`}
                        className="h-4 shrink-0 border-success/60 bg-success/15 px-1.5 py-0 text-[9px] font-medium text-success-foreground"
                      >
                        {t("calendarView.availableBadge")}
                      </Badge>
                    ) : item.status === "TEACHING" ? (
                      <Badge
                        variant="outline"
                        data-testid={`teacher-status-badge-${item.teacher.id}-${track}-${slotKey}`}
                        className="h-4 shrink-0 border-primary/60 bg-primary/15 px-1.5 py-0 text-[9px] font-medium text-primary"
                      >
                        {t("calendarView.teachingBadge")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        data-testid={`teacher-status-badge-${item.teacher.id}-${track}-${slotKey}`}
                        className="h-4 shrink-0 border-border/60 bg-muted/40 px-1.5 py-0 text-[9px] font-medium text-muted-foreground"
                      >
                        {t("calendarView.unavailableBadge")}
                      </Badge>
                    )}

                    <span
                      title={subtitle}
                      className="min-w-0 flex-1 truncate text-end text-[10px] text-muted-foreground"
                    >
                      {subtitle}
                    </span>
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
