"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Clock3, GraduationCap, User } from "lucide-react"
import type { WeekDay } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface SchedulingPlanCalendarFreeTeacherCardProps {
  teacher: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
  day: WeekDay | "EVEN" | "ODD" | string
  slotKey: string
  levelRange: string | null
  suggestedCourseTitle: string | null
  isCollapsed?: boolean
  isSwappable?: boolean
  isDimmed?: boolean
  onClick?: () => void
}

export function SchedulingPlanCalendarFreeTeacherCard({
  teacher,
  day,
  slotKey,
  levelRange,
  suggestedCourseTitle,
  isCollapsed = false,
  isSwappable = false,
  isDimmed = false,
  onClick,
}: SchedulingPlanCalendarFreeTeacherCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const teacherName = `${teacher.firstName} ${teacher.lastName}`
  const headerTitle = suggestedCourseTitle
    ? t("calendarView.suggestedForCourse", { course: suggestedCourseTitle })
    : t("calendarView.freeTeacherBadge")

  return (
    <article
      data-testid={`free-teacher-card-${teacher.id}-${day}-${slotKey}`}
      data-swappable={isSwappable ? "true" : undefined}
      data-dimmed={isDimmed ? "true" : undefined}
      data-collapsed={isCollapsed ? "true" : undefined}
      onClick={
        isSwappable && onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      tabIndex={isSwappable ? 0 : undefined}
      onKeyDown={
        isSwappable && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        "group relative flex min-h-[84px] flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-destructive/70 bg-destructive/10 p-3 shadow-2xs transition-[background-color,border-color,box-shadow] duration-200 ease-in-out select-none",
        isSwappable &&
          "animate-calendar-card-shake z-10 cursor-pointer opacity-100 ring-2 ring-primary/60 hover:animate-none",
        isDimmed && "opacity-25 grayscale hover:opacity-60 hover:grayscale-0"
      )}
      data-grayscale={isDimmed ? "true" : undefined}
      aria-label={teacherName}
    >
      {/* Row 1: Header Title, Level Range & Badge */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full bg-destructive"
            aria-hidden="true"
          />
          <h5
            className="truncate text-sm font-bold text-foreground"
            title={headerTitle}
          >
            {headerTitle}
          </h5>
          {levelRange && (
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
              <GraduationCap aria-hidden className="size-3.5 shrink-0" />
              <span dir="ltr" className="max-w-[130px] truncate font-medium">
                {levelRange}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="outline"
            className="h-5 border-destructive/30 bg-background/80 px-1.5 py-0 text-[10px]"
          >
            {t("calendarView.freeTeacherBadge")}
          </Badge>
        </div>
      </div>

      {/* Row 2: Teacher Avatar & Status Meta */}
      <div className="flex items-center justify-between gap-3 border-t border-destructive/20 pt-2 text-xs">
        {/* Start (Right in RTL): Teacher Avatar & Name */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative flex size-7.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-destructive/20 text-destructive ring-1 ring-border/80">
            {teacher.avatarUrl ? (
              <Image
                src={getAssetUrl(teacher.avatarUrl)}
                alt={teacherName}
                width={30}
                height={30}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <User aria-hidden className="size-4 shrink-0" />
            )}
          </div>
          <span className="truncate text-xs font-bold text-foreground">
            {teacherName}
          </span>
        </div>

        {/* End (Left in RTL): Status / Course Suggestion */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
          <Clock3 aria-hidden className="size-3.5 shrink-0" />
          {suggestedCourseTitle ? (
            <span className="truncate text-xs font-bold">
              {t("calendarView.suggestedForCourse", {
                course: suggestedCourseTitle,
              })}
            </span>
          ) : (
            <span className="text-xs font-medium">
              {t("teacherCalendar.states.FREE")}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
