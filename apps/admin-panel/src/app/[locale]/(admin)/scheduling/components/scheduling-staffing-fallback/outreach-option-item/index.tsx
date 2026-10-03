"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  CalendarClock,
  Check,
  CheckCircle2,
  DoorOpen,
  X,
  XCircle,
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
  pendingAction?: "ACCEPT" | "REJECT" | null
  onToggle: (
    option: SchedulingTeacherOutreachOption,
    action: "ACCEPT" | "REJECT"
  ) => void
}

export function OutreachOptionItem({
  option,
  index,
  canToggle,
  isPending,
  pendingAction,
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
  const isRejected = Boolean(option.isRejected)
  const canClickAccept = canToggle && (!needsRoom || isAccepted)
  const canClickReject = canToggle

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border p-4 transition-all sm:p-5",
        isAccepted
          ? "border-success/40 bg-success/5 shadow-xs"
          : isRejected
            ? "border-destructive/40 bg-destructive/5 shadow-xs"
            : "border-border/60 bg-card hover:border-border hover:shadow-xs"
      )}
    >
      <div className="space-y-3">
        {/* Top Row: Teacher Name, Outreach Type, and Priority Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-foreground">
              {teacherName}
            </h4>
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
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={index === 0 ? "success" : "outline"}
              className="text-xs font-medium"
            >
              {index === 0
                ? t("staffingFallback.bestTimeBadge")
                : t("staffingFallback.alternativeTimeBadge", {
                    rank: formatNumber(index + 1, locale),
                  })}
            </Badge>
            {isAccepted && (
              <Badge variant="success" className="text-xs font-medium">
                {t("staffingFallback.acceptedBadge")}
              </Badge>
            )}
            {isRejected && (
              <Badge variant="destructive" className="text-xs font-medium">
                {t("staffingFallback.teacherRejectedBadge")}
              </Badge>
            )}
          </div>
        </div>

        {/* Schedule Chip */}
        <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <CalendarClock
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span>{days}</span>
          </div>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-semibold text-foreground">
            {option.startTime}–{option.endTime}
          </span>
        </div>

        {/* Status Callout Banner */}
        {option.availabilityChangeDays.length > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            <CalendarClock
              aria-hidden
              className="size-4 shrink-0 text-warning"
            />
            <span className="leading-relaxed">
              {t("staffingFallback.availabilityChange", {
                days: availabilityChangeDays,
                start: option.startTime,
                end: option.endTime,
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
            <Check aria-hidden className="size-4 shrink-0 text-success" />
            <span>{t("staffingFallback.teacherFreeNotice")}</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Classroom Information and Action Buttons */}
      <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 text-xs",
            needsRoom ? "text-warning" : "text-muted-foreground"
          )}
        >
          <DoorOpen
            aria-hidden
            className={cn(
              "size-4 shrink-0",
              needsRoom ? "text-warning" : "text-muted-foreground"
            )}
          />
          <span className="font-semibold text-foreground">
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
                className="bg-background text-xs font-normal"
              >
                {room.name} ({formatNumber(room.capacity, locale)} نفر)
              </Badge>
            ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {canClickReject && (
            <Button
              type="button"
              variant={isRejected ? "destructive" : "outline"}
              aria-pressed={isRejected}
              disabled={isPending}
              onClick={() => onToggle(option, "REJECT")}
              className="w-full shrink-0 font-medium sm:w-auto"
            >
              <span>{t("staffingFallback.teacherRejectedButton")}</span>
              {isPending && pendingAction === "REJECT" ? (
                <Spinner className="size-4 shrink-0" />
              ) : isRejected ? (
                <XCircle aria-hidden className="size-4 shrink-0" />
              ) : (
                <X aria-hidden className="size-4 shrink-0" />
              )}
            </Button>
          )}

          {canClickAccept && (
            <Button
              type="button"
              variant={isAccepted ? "default" : "outline"}
              aria-pressed={isAccepted}
              disabled={isPending}
              onClick={() => onToggle(option, "ACCEPT")}
              className="w-full shrink-0 font-medium sm:w-auto"
            >
              <span>{t("staffingFallback.teacherAcceptedButton")}</span>
              {isPending && pendingAction === "ACCEPT" ? (
                <Spinner className="size-4 shrink-0" />
              ) : isAccepted ? (
                <CheckCircle2 aria-hidden className="size-4 shrink-0" />
              ) : (
                <Check aria-hidden className="size-4 shrink-0" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
