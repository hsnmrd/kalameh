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
        "rounded-xl p-3.5 transition-colors",
        isAccepted ? "border border-success/40 bg-success/5" : "bg-muted/40"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <MessageCircleMore
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {t("staffingFallback.outreachBadge")}
              </Badge>
              <Badge variant={index === 0 ? "success" : "outline"}>
                {index === 0
                  ? t("staffingFallback.bestTimeBadge")
                  : t("staffingFallback.alternativeTimeBadge", {
                      rank: formatNumber(index + 1, locale),
                    })}
              </Badge>
              {isAccepted && (
                <Badge variant="success">
                  {t("staffingFallback.acceptedBadge")}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-foreground">
              {t("staffingFallback.outreachTitle", {
                teacher: teacherName,
              })}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {days} · {option.startTime}–{option.endTime}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-background px-3 py-2.5">
        <p className="text-xs leading-5 font-medium text-foreground">
          {t("staffingFallback.noClassConflict", {
            teacher: teacherName,
          })}
        </p>
        <div className="mt-2 flex items-start gap-2">
          <CalendarClock
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.availabilityChange", {
              days: availabilityChangeDays,
              start: option.startTime,
              end: option.endTime,
            })}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div
          className={
            needsRoom
              ? "flex items-start gap-2 text-warning-foreground"
              : "flex items-start gap-2 text-muted-foreground"
          }
        >
          <DoorOpen aria-hidden className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs">
              {option.deliveryMode === "ONLINE"
                ? t("staffingFallback.online")
                : needsRoom
                  ? t("staffingFallback.roomNeeded")
                  : t("staffingFallback.availableRooms")}
            </p>
            {option.deliveryMode === "IN_PERSON" && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {option.availableClassrooms.map((room) => (
                  <Badge key={room.id} variant="outline">
                    {t("recovery.roomWithCapacity", {
                      room: room.name,
                      capacity: formatNumber(room.capacity, locale),
                    })}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {canClickToggle && (
          <Button
            type="button"
            variant={isAccepted ? "default" : "outline"}
            aria-pressed={isAccepted}
            disabled={isPending}
            onClick={() => onToggle(option)}
            className="w-full sm:w-auto"
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
