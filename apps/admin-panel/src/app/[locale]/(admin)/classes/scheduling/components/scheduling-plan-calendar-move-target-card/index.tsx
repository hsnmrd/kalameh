"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftRight, DoorOpen, GraduationCap, User } from "lucide-react"
import type { WeekDay } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface TargetRoomInfo {
  id: string
  name: string
  capacity: number
  branchId?: string | null
}

export interface TargetTeacherInfo {
  id: string
  firstName: string
  lastName: string
}

export interface SchedulingPlanCalendarMoveTargetCardProps {
  track: "EVEN" | "ODD"
  slotKey: string
  startTime: string
  endTime: string
  targetDays: WeekDay[]
  targetRoom: TargetRoomInfo | null
  targetTeacher?: TargetTeacherInfo | null
  teacherStatus?: "SAME_TEACHER" | "REASSIGNED_TEACHER" | "UNASSIGNED"
  isPending?: boolean
  onClick: () => void
  testId?: string
}

export function SchedulingPlanCalendarMoveTargetCard({
  track,
  slotKey,
  startTime,
  endTime,
  targetRoom,
  targetTeacher,
  teacherStatus,
  isPending = false,
  onClick,
  testId,
}: SchedulingPlanCalendarMoveTargetCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const defaultTestId = `move-target-card-${track}-${slotKey}`

  return (
    <article
      data-testid={testId ?? defaultTestId}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        if (!isPending) {
          onClick()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (!isPending) {
            onClick()
          }
        }
      }}
      className={cn(
        "group relative flex min-h-[84px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-primary/60 bg-primary/5 p-3 text-start shadow-2xs transition-[background-color,border-color,box-shadow,transform] duration-200 ease-in-out select-none hover:border-primary hover:bg-primary/10 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]",
        isPending && "pointer-events-none opacity-60"
      )}
      aria-label={
        targetRoom
          ? t("calendarView.moveSessionAria", {
              days:
                track === "EVEN"
                  ? t("calendarView.evenDays")
                  : t("calendarView.oddDays"),
              time: `${startTime} - ${endTime}`,
              room: targetRoom.name,
            })
          : t("calendarView.moveSessionHere")
      }
    >
      {/* Row 1: Action Title and Room Badge */}
      <div className="flex min-w-0 items-center justify-between gap-2 pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
          </div>
          <span className="truncate text-xs font-bold text-primary">
            {t("calendarView.moveSessionHere")}
          </span>
        </div>

        {targetRoom && (
          <div
            className="flex shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
            title={targetRoom.name}
          >
            <DoorOpen
              aria-hidden="true"
              className="size-3.5 shrink-0 text-primary"
            />
            <span className="max-w-[100px] truncate sm:max-w-[130px]">
              {targetRoom.name}
            </span>
          </div>
        )}
      </div>

      {/* Row 2: Capacity & Teacher info & Pending spinner */}
      <div className="flex items-center justify-between gap-1.5 pt-1 text-[11px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-2">
          {targetRoom && (
            <span className="truncate text-muted-foreground">
              {t("calendarView.targetRoomCapacity", {
                capacity: formatNumber(targetRoom.capacity, locale),
              })}
            </span>
          )}

          {teacherStatus === "REASSIGNED_TEACHER" && targetTeacher ? (
            <div
              className="flex min-w-0 items-center gap-1 font-medium text-primary"
              title={`${targetTeacher.firstName} ${targetTeacher.lastName}`}
            >
              <User
                className="size-3 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="max-w-[90px] truncate sm:max-w-[120px]">
                {targetTeacher.firstName} {targetTeacher.lastName}
              </span>
            </div>
          ) : teacherStatus === "UNASSIGNED" ? (
            <div
              className="flex items-center gap-1 text-muted-foreground"
              title={t("calendarView.newTeacherBadge")}
            >
              <GraduationCap
                className="size-3 shrink-0 text-inherit"
                aria-hidden="true"
              />
              <span>{t("calendarView.newTeacherBadge")}</span>
            </div>
          ) : null}
        </div>

        {isPending && (
          <div className="flex shrink-0 items-center gap-1.5 text-xs text-primary">
            <Spinner className="size-3.5 text-primary" />
          </div>
        )}
      </div>
    </article>
  )
}
