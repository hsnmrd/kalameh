"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock3, GraduationCap, User } from "lucide-react"
import type { WeekDay } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface SchedulingPlanCalendarFreeTeacherCardProps {
  teacher: {
    id: string
    firstName: string
    lastName: string
  }
  day: WeekDay
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
        isDimmed && "opacity-25"
      )}
      aria-label={teacherName}
    >
      {/* Section 1: Header Title & Badge */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
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

        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="outline"
            className={cn(
              "h-4 border-destructive/30 bg-background/80 px-1.5 py-0 text-[10px] transition-opacity duration-200",
              isCollapsed && "hidden"
            )}
          >
            {t("calendarView.freeTeacherBadge")}
          </Badge>
        </div>
      </div>

      {/* Section 2: Teacher Name & Level Range Meta */}
      <div
        className={cn(
          "flex flex-col gap-1 text-[11px] text-muted-foreground transition-all duration-300",
          !isCollapsed && "border-t border-destructive/20 pt-1.5"
        )}
      >
        {/* Teacher Name (Always visible) */}
        <div className="flex items-center gap-1.5 truncate">
          <User aria-hidden className="size-3 shrink-0" />
          <span className="truncate font-medium text-foreground/90">
            {teacherName}
          </span>
        </div>

        {/* Level Range (Collapsible) */}
        <div
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
            <div className="flex items-center gap-1.5 truncate pt-0.5">
              <GraduationCap aria-hidden className="size-3 shrink-0" />
              <span
                dir={levelRange ? "ltr" : undefined}
                className="truncate text-foreground/90"
              >
                {levelRange ?? t("teacherCalendar.noTeachableLevels")}
              </span>
            </div>
          </div>
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
