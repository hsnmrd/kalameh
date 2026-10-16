"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, Check, DoorOpen, User } from "lucide-react"
import type { SchedulingRecoveryOption } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"

export interface RecoveryOptionCardProps {
  option: SchedulingRecoveryOption
  canApply: boolean
  isPending: boolean
  isApplying: boolean
  onApply: (option: SchedulingRecoveryOption) => void
}

export function RecoveryOptionCard({
  option,
  canApply,
  isPending,
  isApplying,
  onApply,
}: RecoveryOptionCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const teacherFullName =
    `${option.teacher.firstName} ${option.teacher.lastName}`.trim()
  const days = option.daysOfWeek
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))
  const isAvailableNow = option.status === "AVAILABLE_NOW"

  return (
    <div
      data-testid={`recovery-option-card-${option.key}`}
      className={cn(
        "flex h-full flex-col justify-between gap-3.5 rounded-xl border p-4 transition-colors",
        isAvailableNow
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border/60 bg-muted/20"
      )}
    >
      {/* Top Row: Status badge, schedule, and submit button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isAvailableNow ? (
            <Badge
              variant="outline"
              className="gap-1 border-success/40 bg-success/10 text-xs text-success"
            >
              <Check aria-hidden className="size-3 text-success" />
              <span>{t("recovery.statuses.AVAILABLE_NOW")}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-warning/40 bg-warning/10 text-xs text-warning-foreground"
            >
              <AlertCircle
                aria-hidden
                className="size-3 text-warning-foreground"
              />
              <span>{t("recovery.statuses.REQUIRES_PLAN_CHANGE")}</span>
            </Badge>
          )}

          <span className="text-xs font-bold text-foreground">
            {days} · {option.startTime}–{option.endTime}
          </span>
        </div>

        {/* Action Button */}
        <Button
          type="button"
          size="sm"
          data-testid={`apply-recovery-option-btn-${option.key}`}
          disabled={!canApply || isPending}
          onClick={() => onApply(option)}
          className="shrink-0 gap-1.5 font-medium"
        >
          {isApplying ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <Check aria-hidden className="size-3.5" />
              <span>{t("recovery.applyAction")}</span>
            </>
          )}
        </Button>
      </div>

      {/* Teacher Profile & Classroom Details */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Teacher profile */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/80">
            {option.teacher.avatarUrl ? (
              <Image
                src={getAssetUrl(option.teacher.avatarUrl)}
                alt={teacherFullName}
                width={40}
                height={40}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <User aria-hidden className="size-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground">
              {teacherFullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("recovery.teacher")}
            </span>
          </div>
        </div>

        {/* Classroom availability */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <DoorOpen
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          {option.deliveryMode === "ONLINE" ? (
            <Badge variant="outline" className="text-xs">
              {t("recovery.onlineRoom")}
            </Badge>
          ) : option.availableClassrooms.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {option.availableClassrooms.map((room) => (
                <Badge
                  key={room.id}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {t("recovery.roomWithCapacity", {
                    room: room.name,
                    capacity: formatNumber(room.capacity, locale),
                  })}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs font-medium text-destructive">
              {t("recovery.noEmptyRoom")}
            </span>
          )}
        </div>
      </div>

      {/* Blocking classes notice if room requires freeing */}
      {option.blockingClasses.length > 0 && (
        <div className="rounded-lg bg-warning/10 p-2 text-xs text-warning-foreground">
          <p className="font-semibold">{t("recovery.changeNeeded")}:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {option.blockingClasses.map((bc) => (
              <li key={bc.id}>
                {t("recovery.blockingClass", {
                  title: bc.title,
                  room: bc.classroom?.name ?? "",
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
