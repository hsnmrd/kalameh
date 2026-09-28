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
  canEdit: boolean
  onUnassign?: () => void
  isActive?: boolean
  isDimmed?: boolean
  onHover?: (id: string | null) => void
  onClick?: (id: string) => void
}

export function SchedulingPlanCalendarMissedClassCard({
  assignment,
  assignedRoomName,
  canEdit,
  onUnassign,
  isActive = false,
  isDimmed = false,
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

  const classKey = `missed:${assignment.key}`

  return (
    <article
      data-testid={`missed-class-card-${assignment.key}`}
      data-class-id={classKey}
      data-active={isActive ? "true" : undefined}
      data-dimmed={isDimmed ? "true" : undefined}
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
        "group relative flex h-[134px] cursor-pointer flex-col justify-between rounded-xl border-2 border-dashed border-warning/70 bg-warning/10 p-2.5 shadow-2xs transition-all duration-200 select-none",
        isActive &&
          "z-10 scale-[1.02] opacity-100 shadow-md ring-2 ring-warning",
        isDimmed && "opacity-25 hover:opacity-60"
      )}
      aria-label={assignment.course.title}
    >
      {/* Header: Title, Badge, and Quick Action */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h5
            className="truncate text-xs font-bold text-foreground"
            title={assignment.course.title}
          >
            {assignment.course.title}
          </h5>
          <p className="truncate text-[11px] font-medium text-warning-foreground">
            {t("hiringPlan.courseClass", {
              course: assignment.course.title,
              number: formatNumber(assignment.classNumber, locale),
            })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="warning" className="h-4 px-1.5 py-0 text-[10px]">
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

      {/* Meta: Teacher & Room */}
      <div className="flex flex-col gap-1 border-t border-warning/20 pt-1.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <GraduationCap aria-hidden className="size-3 shrink-0 text-warning" />
          <span className="truncate text-xs font-medium text-foreground">
            {t("hiringPlan.pendingTeacher")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <DoorOpen aria-hidden className="size-3 shrink-0 text-warning" />
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

      {/* Capacity Info (Matches regular class card structure) */}
      <div className="flex items-center justify-between border-t border-warning/20 pt-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users aria-hidden className="size-3 shrink-0" />
          <span className="text-[10px] font-medium">{t("capacity")}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-foreground tabular-nums">
          {assignment.classroom?.capacity ? (
            <span className="text-[10px] font-medium text-warning-foreground">
              {formatNumber(assignment.classroom.capacity, locale)} نفر
            </span>
          ) : (
            <span className="text-[10px] font-medium text-warning-foreground">
              {t("calendarView.roomNeeded")}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
