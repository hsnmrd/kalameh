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
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-destructive/70 bg-destructive/10 shadow-2xs transition-[height,padding,background-color,border-color,box-shadow] duration-300 ease-in-out select-none",
        isCollapsed ? "h-[52px] p-2" : "h-[134px] p-2.5",
        isSwappable &&
          "animate-calendar-card-shake z-10 cursor-pointer opacity-100 ring-2 ring-primary/60 hover:animate-none",
        isDimmed && "opacity-25 grayscale hover:opacity-60 hover:grayscale-0"
      )}
      data-grayscale={isDimmed ? "true" : undefined}
      aria-label={teacherName}
    >
      {/* Section 1: Header Title, Level Range & Badge */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full bg-destructive"
            aria-hidden="true"
          />
          <h5
            className="truncate text-xs font-bold text-foreground"
            title={headerTitle}
          >
            {headerTitle}
          </h5>
        </div>

        {/* Center: Level Range Chip */}
        {levelRange && (
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive">
            <GraduationCap aria-hidden className="size-3 shrink-0" />
            <span dir="ltr" className="max-w-[130px] truncate font-medium">
              {levelRange}
            </span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="outline"
            className="h-4 border-destructive/30 bg-background/80 px-1.5 py-0 text-[10px]"
          >
            {t("calendarView.freeTeacherBadge")}
          </Badge>
        </div>
      </div>

      {/* Section 2: Teacher Name & Status Meta */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 text-[11px] text-muted-foreground transition-all duration-300",
          !isCollapsed && "border-t border-destructive/20 pt-2"
        )}
      >
        {/* Teacher Name (Always visible) */}
        <div className="flex min-w-0 items-center gap-1.5 truncate">
          <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-destructive/20 text-destructive">
            {teacher.avatarUrl ? (
              <Image
                src={getAssetUrl(teacher.avatarUrl)}
                alt={teacherName}
                width={20}
                height={20}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <User aria-hidden className="size-3 shrink-0" />
            )}
          </div>
          <span className="truncate font-semibold text-foreground/90">
            {teacherName}
          </span>
        </div>

        {/* Level Range (Expanded or secondary) */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 truncate text-[11px] transition-opacity duration-200",
            isCollapsed ? "hidden" : "flex",
            isDimmed && "opacity-30 group-hover:opacity-100"
          )}
        >
          <span
            dir={levelRange ? "ltr" : undefined}
            className="truncate font-medium text-foreground/90"
          >
            {levelRange ?? t("teacherCalendar.noTeachableLevels")}
          </span>
        </div>
      </div>

      {/* Section 3: Status / Suggestion Info (Collapsible) */}
      <div
        data-testid={`free-teacher-card-details-${teacher.id}-${day}-${slotKey}`}
        aria-hidden={isCollapsed}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isCollapsed
            ? "pointer-events-none grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div
          className={cn(
            "overflow-hidden transition-opacity duration-200",
            isDimmed && "opacity-30 group-hover:opacity-100"
          )}
        >
          <div className="flex items-center justify-between border-t border-destructive/20 pt-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock3 aria-hidden className="size-3 shrink-0" />
              <span className="text-[10px] font-medium">
                {t("calendarView.freeTeacherStatusLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
              {suggestedCourseTitle ? (
                <span className="truncate text-[10px] font-semibold text-primary">
                  {t("calendarView.suggestedForCourse", {
                    course: suggestedCourseTitle,
                  })}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground">
                  {t("teacherCalendar.states.FREE")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
