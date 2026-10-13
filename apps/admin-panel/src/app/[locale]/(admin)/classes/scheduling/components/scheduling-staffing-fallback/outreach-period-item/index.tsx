"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  PhoneCall,
  X,
  XCircle,
} from "lucide-react"
import type { SchedulingTeacherOutreachOption, WeekDay } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface OutreachPeriodItemProps {
  option: SchedulingTeacherOutreachOption
  index: number
  totalInGroup: number
  canToggle: boolean
  isPending: boolean
  pendingAction?: "ACCEPT" | "REJECT" | null
  currentSchedule?: {
    daysOfWeek: WeekDay[]
    startTime: string
    endTime: string
  } | null
  onToggle: (
    option: SchedulingTeacherOutreachOption,
    action: "ACCEPT" | "REJECT"
  ) => void
}

export function OutreachPeriodItem({
  option,
  index,
  canToggle,
  isPending,
  pendingAction,
  currentSchedule,
  onToggle,
}: OutreachPeriodItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

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

  const isBankOption = option.key.startsWith("bank-")

  const isTimeChanged = React.useMemo(() => {
    if (isBankOption) return false
    if (!currentSchedule?.daysOfWeek?.length || !currentSchedule.startTime) {
      return false
    }
    const isSameDays =
      currentSchedule.daysOfWeek.length === option.daysOfWeek.length &&
      currentSchedule.daysOfWeek.every((d) => option.daysOfWeek.includes(d))
    const isSameTime =
      currentSchedule.startTime === option.startTime &&
      currentSchedule.endTime === option.endTime
    return !(isSameDays && isSameTime)
  }, [isBankOption, currentSchedule, option])

  const currentScheduleText = React.useMemo(() => {
    if (
      !currentSchedule?.daysOfWeek?.length ||
      !currentSchedule.startTime ||
      !currentSchedule.endTime
    ) {
      return null
    }
    const curDays = currentSchedule.daysOfWeek
      .map((day) => t(`weekDays.${day}`))
      .join(t("daySeparator"))
    return `${curDays} · ${currentSchedule.startTime}–${currentSchedule.endTime}`
  }, [currentSchedule, t])

  return (
    <div
      data-testid={`outreach-period-item-${option.key}`}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border p-3 transition-all sm:p-3.5",
        isAccepted
          ? "border-success/40 bg-success/5 shadow-2xs"
          : isRejected
            ? "border-destructive/40 bg-destructive/5 shadow-2xs"
            : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
      )}
    >
      {/* Top Row: Schedule Chip and Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground">
          <CalendarClock
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          {isTimeChanged && currentScheduleText ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground line-through decoration-muted-foreground/60">
                {currentScheduleText}
              </span>
              <ArrowRight
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
              />
              <span className="text-foreground">
                {days} · {option.startTime}–{option.endTime}
              </span>
            </div>
          ) : (
            <>
              <span>{days}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="tabular-nums">
                {option.startTime}–{option.endTime}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Badge: بدون تغییر ساعت کلاس OR با تغییر ساعت کلاس */}
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-semibold",
              isTimeChanged
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-success/40 bg-success/10 text-success"
            )}
          >
            {isTimeChanged
              ? t("staffingFallback.timeChangedBadge")
              : t("staffingFallback.timeUnchangedBadge")}
          </Badge>

          {index === 0 && !isBankOption && (
            <Badge
              variant={isTimeChanged ? "outline" : "success"}
              className="text-[11px] font-medium"
            >
              {t("staffingFallback.bestTimeBadge")}
            </Badge>
          )}
          {index > 0 && !isBankOption && (
            <Badge variant="outline" className="text-[11px] font-medium">
              {t("staffingFallback.alternativeTimeBadge", {
                rank: formatNumber(index + 1, locale),
              })}
            </Badge>
          )}
          {isAccepted && (
            <Badge variant="success" className="text-[11px] font-medium">
              {t("staffingFallback.acceptedBadge")}
            </Badge>
          )}
          {isRejected && (
            <Badge variant="destructive" className="text-[11px] font-medium">
              {t("staffingFallback.teacherRejectedBadge")}
            </Badge>
          )}
        </div>
      </div>

      {/* Availability Status Callout */}
      {isBankOption ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-foreground">
          <PhoneCall
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <span>{t("staffingFallback.bankTeacherNotice")}</span>
        </div>
      ) : option.availabilityChangeDays.length > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs font-medium text-warning">
          <CalendarClock
            aria-hidden
            className="size-3.5 shrink-0 text-warning"
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
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success">
          <Check aria-hidden className="size-3.5 shrink-0 text-success" />
          <span>{t("staffingFallback.teacherFreeNotice")}</span>
        </div>
      )}

      {/* Action Buttons at Bottom of Card */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
        {canClickReject && (
          <Button
            type="button"
            variant={isRejected ? "destructive" : "outline"}
            size="sm"
            aria-pressed={isRejected}
            disabled={isPending}
            onClick={() => onToggle(option, "REJECT")}
            className="h-8 flex-1 gap-1 rounded-lg px-2 text-xs font-medium"
          >
            <span>{t("staffingFallback.teacherRejectedButton")}</span>
            {isPending && pendingAction === "REJECT" ? (
              <Spinner className="size-3.5 shrink-0" />
            ) : isRejected ? (
              <XCircle aria-hidden className="size-3.5 shrink-0" />
            ) : (
              <X aria-hidden className="size-3.5 shrink-0" />
            )}
          </Button>
        )}

        {canClickAccept && (
          <Button
            type="button"
            variant={isAccepted ? "default" : "outline"}
            size="sm"
            aria-pressed={isAccepted}
            disabled={isPending}
            onClick={() => onToggle(option, "ACCEPT")}
            className="h-8 flex-1 gap-1 rounded-lg px-2 text-xs font-medium"
          >
            <span>{t("staffingFallback.teacherAcceptedButton")}</span>
            {isPending && pendingAction === "ACCEPT" ? (
              <Spinner className="size-3.5 shrink-0" />
            ) : isAccepted ? (
              <CheckCircle2 aria-hidden className="size-3.5 shrink-0" />
            ) : (
              <Check aria-hidden className="size-3.5 shrink-0" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
