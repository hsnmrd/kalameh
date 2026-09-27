"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  CalendarClock,
  DoorOpen,
  MessageCircleMore,
  UserPlus,
} from "lucide-react"
import type { SchedulingStaffingFallback } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingStaffingFallbackProps {
  fallback: SchedulingStaffingFallback
  targetCourseTitle: string
}

export function SchedulingStaffingFallback({
  fallback,
  targetCourseTitle,
}: SchedulingStaffingFallbackProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  if (!fallback.addTeacherSuggested) return null

  const timeWindows = Array.from(
    new Map(
      fallback.availabilityOptions.map((option) => {
        const days = option.daysOfWeek
          .map((day) => t(`weekDays.${day}`))
          .join(t("daySeparator"))
        const label = `${days} · ${option.startTime}–${option.endTime}`
        return [label, label]
      })
    ).values()
  )

  return (
    <section
      aria-label={t("staffingFallback.title")}
      className="rounded-xl border border-border p-3.5"
    >
      <div className="flex items-start gap-2">
        <UserPlus
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-foreground"
        />
        <div>
          <h5 className="text-xs font-semibold text-foreground">
            {t("staffingFallback.title")}
          </h5>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.description")}
          </p>
        </div>
      </div>

      {fallback.availabilityOptions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2.5">
          {fallback.availabilityOptions.map((option) => {
            const teacherName = `${option.teacher.firstName} ${option.teacher.lastName}`
            const days = option.daysOfWeek
              .map((day) => t(`weekDays.${day}`))
              .join(t("daySeparator"))
            const availabilityChangeDays = option.availabilityChangeDays
              .map((day) => t(`weekDays.${day}`))
              .join(t("daySeparator"))

            return (
              <li key={option.key} className="rounded-xl bg-muted/40 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <MessageCircleMore
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-foreground"
                    />
                    <div>
                      <Badge variant="secondary">
                        {t("staffingFallback.outreachBadge")}
                      </Badge>
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

                <div className="mt-3 flex items-start gap-2">
                  <DoorOpen
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {option.deliveryMode === "ONLINE"
                        ? t("staffingFallback.online")
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
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-3 rounded-xl bg-muted/40 p-3.5">
        <div className="flex items-start gap-2">
          <UserPlus
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div className="min-w-0">
            <Badge variant="outline">
              {t("staffingFallback.addTeacherBadge")}
            </Badge>
            <p className="mt-2 text-xs font-semibold text-foreground">
              {t("staffingFallback.addTeacherTitle", {
                course: targetCourseTitle,
              })}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(
                timeWindows.length > 0
                  ? "staffingFallback.addTeacherDescriptionWithSlots"
                  : "staffingFallback.addTeacherDescription"
              )}
            </p>
          </div>
        </div>

        {timeWindows.length > 0 && (
          <div className="mt-3 flex items-start gap-2 border-t border-border pt-3">
            <CalendarClock
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="flex flex-wrap gap-1.5">
              {timeWindows.map((timeWindow) => (
                <Badge key={timeWindow} variant="outline">
                  {timeWindow}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
