"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { DoorOpen, GraduationCap, Users, X } from "lucide-react"
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

  return (
    <article
      data-testid={`missed-class-card-${assignment.key}`}
      data-class-id={classKey}
      data-active={isActive ? "true" : undefined}
      data-swappable={isSwappable ? "true" : undefined}
      data-dimmed={isDimmed ? "true" : undefined}
      data-collapsed={isCollapsed ? "true" : undefined}
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
        "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-warning/70 bg-warning/10 shadow-2xs transition-[height,padding,background-color,border-color,box-shadow] duration-300 ease-in-out select-none",
        isCollapsed ? "h-[52px] p-2" : "h-[134px] p-2.5",
        isActive &&
          "z-10 scale-[1.02] opacity-100 shadow-md ring-2 ring-warning",
        isSwappable &&
          "animate-calendar-card-shake z-10 opacity-100 ring-2 ring-primary/60 hover:animate-none",
        isDimmed && "opacity-25 hover:opacity-60"
      )}
      aria-label={assignment.course.title}
    >
      {/* Section 1: Course Title, Badges, Actions */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full bg-warning"
            aria-hidden="true"
          />
          <h5
            className="truncate text-xs font-bold text-foreground"
            title={assignment.course.title}
          >
            {assignment.course.title}
          </h5>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant="warning"
            className={cn(
              "h-4 px-1.5 py-0 text-[10px] transition-opacity duration-200",
              isCollapsed && "hidden"
            )}
          >
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
              className="size-5 rounded-md p-0 text-muted-foreground hover:bg-warning/20 hover:text-foreground"
              title={t("calendarView.unassign")}
              aria-label={t("calendarView.unassign")}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Section 2: Teacher & Room Meta */}
      <div
        className={cn(
          "flex flex-col gap-1 text-[11px] text-muted-foreground transition-all duration-300",
          !isCollapsed && "border-t border-warning/20 pt-1.5"
        )}
      >
        {/* Teacher (Always visible) */}
        <div className="flex items-center gap-1.5 truncate">
          <GraduationCap aria-hidden className="size-3 shrink-0" />
          <span className="truncate font-medium text-foreground/90">
            {t("hiringPlan.pendingTeacher")}
          </span>
        </div>

        {/* Room (Collapsible) */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isCollapsed
              ? "pointer-events-none grid-rows-[0fr] opacity-0"
              : "grid-rows-[1fr] opacity-100"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5 truncate pt-0.5">
              <DoorOpen aria-hidden className="size-3 shrink-0" />
              <span
                className={
                  !assignedRoomName && !isOnline
                    ? "truncate font-medium text-warning-foreground"
                    : "truncate text-foreground/90"
                }
              >
                {roomLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Capacity Info (Collapsible) */}
      <div
        data-testid={`missed-class-card-details-${assignment.key}`}
        aria-hidden={isCollapsed}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isCollapsed
            ? "pointer-events-none grid-rows-[0fr] opacity-0"
            : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between border-t border-warning/20 pt-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users aria-hidden className="size-3 shrink-0" />
              <span className="text-[10px] font-medium">{t("capacity")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-foreground tabular-nums">
              {effectiveRoomCapacity ? (
                <span className="text-[10px] font-medium text-warning-foreground">
                  {formatNumber(effectiveRoomCapacity, locale)} نفر
                </span>
              ) : (
                <span className="text-[10px] font-medium text-warning-foreground">
                  {t("calendarView.roomNeeded")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
