"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import type { SchedulingNewTeacherHiringAssignment } from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { CurrentAssignmentState } from "../index"
import { AssignmentItem } from "../assignment-item"

export interface ClassesCarouselProps {
  assignments: SchedulingNewTeacherHiringAssignment[]
  activeAssignmentsState: Record<string, CurrentAssignmentState>
}

export function ClassesCarousel({
  assignments,
  activeAssignmentsState,
}: ClassesCarouselProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  if (assignments.length === 0) return null

  return (
    <div className="mt-3">
      <Carousel
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          direction: locale === "fa" ? "rtl" : "ltr",
        }}
        className="w-full"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("hiringPlan.classesCarouselTitle", {
              count: formatNumber(assignments.length, locale),
            })}
          </span>
          {assignments.length > 1 && (
            <div className="flex items-center gap-1">
              <CarouselPrevious
                type="button"
                className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              />
              <CarouselNext
                type="button"
                className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              />
            </div>
          )}
        </div>

        <CarouselContent className="-ms-2.5">
          {assignments.map((assignment, index) => {
            const current = activeAssignmentsState[assignment.key]
            return (
              <CarouselItem
                key={assignment.key}
                className="basis-full ps-2.5 sm:basis-[80%] md:basis-1/2"
              >
                <AssignmentItem
                  assignment={assignment}
                  index={index}
                  assignedState={current}
                />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
