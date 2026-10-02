"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Building2,
  DoorOpen,
  Globe,
  GraduationCap,
  Users,
  X,
} from "lucide-react"
import type { SchedulingNewTeacherHiringAssignment } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface SchedulingPlanCalendarMissedClassCardProps {
  assignment: SchedulingNewTeacherHiringAssignment
  assignedRoomName?: string | null
  assignedRoomCapacity?: number | null
  canEdit: boolean
  onUnassign?: () => void
  isActive?: boolean
  isSwappable?: boolean
  isDimmed?: boolean
  isCollapsed?: boolean
  hasSameCourse?: boolean
  sameCourseCount?: number
  onHover?: (id: string | null) => void
  onClick?: (id: string) => void
}

export function SchedulingPlanCalendarMissedClassCard({
  assignment,
  assignedRoomName,
  assignedRoomCapacity,
  canEdit,
  onUnassign,
  isActive = false,
  isSwappable = false,
  isDimmed = false,
  isCollapsed = false,
  hasSameCourse = false,
  sameCourseCount,
  onHover,
  onClick,
}: SchedulingPlanCalendarMissedClassCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const isOnline = assignment.deliveryMode === "ONLINE"
  const roomLabel = isOnline
    ? t("hiringPlan.online")
    : assignedRoomName
      ? t("hiringPlan.room", { room: assignedRoomName })
      : t("calendarView.roomNeeded")
  const effectiveRoomCapacity =
    assignedRoomCapacity ?? assignment.classroom?.capacity

  const classKey = `missed:${assignment.key}`
  const isGrayscale = isDimmed && !isActive && !isSwappable && !hasSameCourse

  return (
    <article
      data-testid={`missed-class-card-${assignment.key}`}
      data-class-id={classKey}
      data-active={isActive ? "true" : undefined}
      data-swappable={isSwappable ? "true" : undefined}
      data-dimmed={isDimmed ? "true" : undefined}
      data-grayscale={isGrayscale ? "true" : undefined}
      data-collapsed={isCollapsed ? "true" : undefined}
      data-same-course={hasSameCourse ? "true" : undefined}
      data-same-course-count={sameCourseCount}
      onMouseEnter={() => onHover?.(classKey)}
      onMouseLeave={() => onHover?.(null)}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(classKey)
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.(classKey)
        }
      }}
      className={cn(
        "group relative flex min-h-[84px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-warning/70 bg-warning/10 p-3 shadow-2xs transition-[background-color,border-color,box-shadow,filter,transform] duration-200 ease-in-out select-none",
        isActive &&
          "z-10 scale-[1.01] opacity-100 shadow-md ring-2 ring-warning",
        isSwappable &&
          "animate-calendar-card-shake z-10 opacity-100 ring-2 ring-primary/60 hover:animate-none",
        isDimmed && "opacity-25 hover:opacity-60",
        isGrayscale && "grayscale hover:grayscale-0"
      )}
      aria-label={assignment.course.title}
    >
      {/* Row 1: Course Title & Level, Mode, Location, Status & Unassign */}
      <div className="flex min-w-0 items-center justify-between gap-2 pb-2.5">
        {/* Start (Right in RTL): Dot, Course Title, Badges */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full bg-warning"
            aria-hidden="true"
          />
          <h5
            className="truncate text-sm font-bold text-foreground"
            title={assignment.course.title}
          >
            {hasSameCourse ? (
              <mark className="inline-block max-w-full truncate rounded-none bg-[#ffff00] px-0.5 text-black">
                {assignment.course.title}
              </mark>
            ) : (
              assignment.course.title
            )}
          </h5>
          {hasSameCourse && (
            <span
              data-testid={`same-course-badge-${assignment.key}`}
              className="shrink-0 rounded border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary"
            >
              {t("calendarView.sameCourseBadge")}
            </span>
          )}
          {/* Delivery mode badge pill */}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-warning/30 bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
            {isOnline ? (
              <Globe aria-hidden className="size-3 text-inherit" />
            ) : (
              <Building2 aria-hidden className="size-3 text-inherit" />
            )}
            <span>
              {isOnline
                ? t("deliveryModes.ONLINE")
                : t("deliveryModes.IN_PERSON")}
            </span>
          </span>
        </div>

        {/* End (Left in RTL): Location, New Teacher Badge & Unassign */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Room / Location */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-warning/20 px-2 py-0.5 text-xs text-warning-foreground">
            {isOnline ? (
              <Globe aria-hidden className="size-3.5 shrink-0 text-inherit" />
            ) : (
              <DoorOpen
                aria-hidden
                className="size-3.5 shrink-0 text-inherit"
              />
            )}
            <span className="max-w-[140px] truncate font-medium">
              {roomLabel}
            </span>
          </div>

          <Badge variant="warning" className="h-5 px-1.5 py-0 text-[10px]">
            {t("calendarView.newTeacherBadge")}
          </Badge>

          {canEdit && onUnassign && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onUnassign()
              }}
              className="size-6 rounded-md p-0 text-muted-foreground hover:bg-warning/20 hover:text-foreground"
              title={t("calendarView.unassign")}
              aria-label={t("calendarView.unassign")}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Teacher Pending Placeholder & Capacity */}
      <div className="flex items-center justify-between gap-3 border-t border-warning/20 pt-2.5 text-xs">
        {/* Start (Right in RTL): Teacher Pending Info */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative flex size-7.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warning/20 text-warning-foreground ring-1 ring-warning/30">
            <GraduationCap aria-hidden className="size-4 shrink-0" />
          </div>
          <span className="truncate text-xs font-bold text-foreground">
            {t("hiringPlan.pendingTeacher")}
          </span>
        </div>

        {/* End (Left in RTL): Capacity or room note */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning-foreground tabular-nums">
          <Users aria-hidden className="size-3.5 shrink-0 text-inherit" />
          {effectiveRoomCapacity ? (
            <span>{formatNumber(effectiveRoomCapacity, locale)} نفر</span>
          ) : (
            <span className="font-normal">{t("calendarView.roomNeeded")}</span>
          )}
        </div>
      </div>
    </article>
  )
}
