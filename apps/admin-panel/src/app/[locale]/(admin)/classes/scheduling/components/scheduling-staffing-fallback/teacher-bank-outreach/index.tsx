"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { PhoneCall } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../scheduling-new-teacher-assignment-list"

export interface TeacherBankOutreachProps {
  teachers: Array<{
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }>
  hiringAssignments?: NewTeacherAssignment[]
}

export function TeacherBankOutreach({
  teachers,
  hiringAssignments = [],
}: TeacherBankOutreachProps) {
  const t = useTranslations("scheduling.planDetails")

  if (teachers.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
      <div className="flex items-start gap-2.5">
        <PhoneCall
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-foreground"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("staffingFallback.teacherBankBadge")}
            </Badge>
            <p className="text-xs font-semibold text-foreground">
              {t("staffingFallback.teacherBankTitle")}
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("staffingFallback.teacherBankDescription")}
          </p>

          {/* Unavailable Bank Teachers */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {teachers.map((teacher) => {
              const teacherName =
                `${teacher.firstName} ${teacher.lastName}`.trim()
              return (
                <div
                  key={teacher.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 shadow-2xs"
                >
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                    {teacher.avatarUrl ? (
                      <Image
                        src={getAssetUrl(teacher.avatarUrl)}
                        alt={teacherName}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {teacher.firstName[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {teacherName}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-muted-foreground"
                  >
                    {t("staffingFallback.callTeacherBadge")}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Needed time slot if available */}
      {hiringAssignments.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-2.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("staffingFallback.neededSlotNotice")}:
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {hiringAssignments.map((a) => {
              const days = a.daysOfWeek
                .map((day) => t(`weekDays.${day}`))
                .join(t("daySeparator"))
              return (
                <Badge key={a.key} variant="outline" className="text-xs">
                  {days} · {a.startTime}–{a.endTime}
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
