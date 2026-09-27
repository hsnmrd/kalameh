"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRightLeft,
  CalendarClock,
  DoorOpen,
  UserRound,
} from "lucide-react"
import type { SchedulingRecoveryOption as RecoveryOption } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingRecoveryOptionProps {
  option: RecoveryOption
}

export function SchedulingRecoveryOption({
  option,
}: SchedulingRecoveryOptionProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const teacherName = `${option.teacher.firstName} ${option.teacher.lastName}`
  const days = option.daysOfWeek
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))

  return (
    <li className="rounded-xl border border-border bg-background p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant={option.status === "AVAILABLE_NOW" ? "success" : "warning"}
        >
          {t(`recovery.statuses.${option.status}`)}
        </Badge>
        <span className="text-xs font-medium text-muted-foreground">
          {t("timeRange", {
            start: option.startTime,
            end: option.endTime,
          })}
        </span>
      </div>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <UserRound
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("recovery.teacher")}
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {teacherName}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <CalendarClock
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("recovery.schedule")}
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {days} · {option.startTime}–{option.endTime}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
        <DoorOpen
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {option.deliveryMode === "ONLINE"
              ? t("recovery.onlineRoom")
              : t("recovery.emptyRooms")}
          </p>
          {option.deliveryMode === "IN_PERSON" && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {option.availableClassrooms.length > 0 ? (
                option.availableClassrooms.map((room) => (
                  <Badge key={room.id} variant="outline">
                    {t("recovery.roomWithCapacity", {
                      room: room.name,
                      capacity: formatNumber(room.capacity, locale),
                    })}
                  </Badge>
                ))
              ) : (
                <span className="text-xs font-medium text-foreground">
                  {t("recovery.noEmptyRoom")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {option.blockingClasses.length > 0 && (
        <div className="mt-3 rounded-lg bg-muted/60 p-3">
          <div className="flex items-start gap-2">
            <ArrowRightLeft
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("recovery.changeNeeded")}
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-5 text-muted-foreground">
                {option.blockingClasses.map((blockingClass) => (
                  <li key={blockingClass.id}>
                    {t("recovery.blockingClass", {
                      title: blockingClass.title,
                      resources: blockingClass.conflictTypes
                        .map((type) => t(`recovery.conflictTypes.${type}`))
                        .join(t("daySeparator")),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
