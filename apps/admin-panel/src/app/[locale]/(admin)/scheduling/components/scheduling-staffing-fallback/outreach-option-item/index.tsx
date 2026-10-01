"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  CalendarClock,
  Check,
  CheckCircle2,
  DoorOpen,
  MessageCircleMore,
} from "lucide-react"
import type { SchedulingTeacherOutreachOption } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface OutreachOptionItemProps {
  option: SchedulingTeacherOutreachOption
  index: number
  canToggle: boolean
  isPending: boolean
  onToggle: (option: SchedulingTeacherOutreachOption) => void
}

export function OutreachOptionItem({
  option,
  index,
  canToggle,
  isPending,
  onToggle,
}: OutreachOptionItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const teacherName = `${option.teacher.firstName} ${option.teacher.lastName}`
  const days = option.daysOfWeek
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))
  const availabilityChangeDays = option.availabilityChangeDays
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))
  const needsRoom =
    option.deliveryMode === "IN_PERSON" &&
    option.availableClassrooms.length === 0
  const isAccepted = Boolean(option.isAccepted)
  const canClickToggle = canToggle && (!needsRoom || isAccepted)

  return (
    <li
      className={cn(
        "rounded-xl border p-3.5 transition-all sm:p-4",
        isAccepted
          ? "border-success/40 bg-success/5 shadow-xs"
          : "border-border/60 bg-card hover:border-border hover:shadow-xs"
      )}
    >
      {/* Top Row: Teacher, Level, Priority and Schedule */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {teacherName}
          </span>
          {option.higherLevelCourseTitle ? (
            <Badge variant="secondary" className="text-xs">
              {t("staffingFallback.higherLevelTeacherBadge")}:{" "}
              {option.higherLevelCourseTitle}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              {t("staffingFallback.outreachBadge")}
            </Badge>
          )}
          <Badge
            variant={index === 0 ? "success" : "outline"}
            className="text-xs"
          >
            {index === 0
              ? t("staffingFallback.bestTimeBadge")
              : t("staffingFallback.alternativeTimeBadge", {
                  rank: formatNumber(index + 1, locale),
                })}
          </Badge>
          {isAccepted && (
            <Badge variant="success" className="text-xs">
              {t("staffingFallback.acceptedBadge")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <CalendarClock
            aria-hidden
            className="size-3.5 text-muted-foreground"
          />
          <span>{days}</span>
          <span className="text-muted-foreground">·</span>
          <span>
            {option.startTime}–{option.endTime}
          </span>
        </div>
      </div>

      {/* Middle Row: Concise Status & Schedule Notice */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
        {option.availabilityChangeDays.length > 0 ? (
          <div className="flex items-center gap-1.5 font-medium text-warning-foreground">
            <CalendarClock aria-hidden className="size-3.5 shrink-0" />
            <span>
              {t("staffingFallback.availabilityChange", {
                days: availabilityChangeDays,
                start: option.startTime,
                end: option.endTime,
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-medium text-success">
            <Check aria-hidden className="size-3.5 shrink-0" />
            <span>{t("staffingFallback.teacherFreeNotice")}</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Classrooms on side, Action Button on the other */}
      <div className="mt-3 flex flex-col gap-3 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 text-xs",
            needsRoom ? "text-warning-foreground" : "text-muted-foreground"
          )}
        >
          <DoorOpen aria-hidden className="size-3.5 shrink-0" />
          <span className="font-medium">
            {option.deliveryMode === "ONLINE"
              ? t("staffingFallback.online")
              : needsRoom
                ? t("staffingFallback.roomNeeded")
                : t("staffingFallback.availableRoomsLabel")}
          </span>
          {option.deliveryMode === "IN_PERSON" &&
            option.availableClassrooms.map((room) => (
              <Badge
                key={room.id}
                variant="outline"
                className="text-[11px] font-normal"
              >
                {room.name} ({formatNumber(room.capacity, locale)} نفر)
              </Badge>
            ))}
        </div>

        {canClickToggle && (
          <Button
            type="button"
            variant={isAccepted ? "default" : "outline"}
            aria-pressed={isAccepted}
            disabled={isPending}
            onClick={() => onToggle(option)}
            className="w-full shrink-0 font-medium sm:w-auto"
          >
            {isPending ? (
              <Spinner className="size-4 shrink-0" />
            ) : isAccepted ? (
              <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            ) : (
              <Check aria-hidden className="size-4 shrink-0" />
            )}
            <span>{t("staffingFallback.teacherAcceptedButton")}</span>
          </Button>
        )}
      </div>
    </li>
  )
}
