"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  UsersRound,
} from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingWarningList } from "../scheduling-warning-list"

type SchedulingProposalDetails = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingProposalDetailsItemProps {
  proposal: SchedulingProposalDetails
}

export function SchedulingProposalDetailsItem({
  proposal,
}: SchedulingProposalDetailsItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const teacherName = `${proposal.teacher.firstName} ${proposal.teacher.lastName}`
  const location =
    proposal.deliveryMode === "ONLINE"
      ? t("deliveryModes.ONLINE")
      : [proposal.branch?.name, proposal.classroom?.name]
          .filter(Boolean)
          .join(" · ") || t("notSpecified")

  return (
    <li className="rounded-2xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-foreground">{proposal.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {proposal.course.title} · {teacherName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {proposal.isLocked && (
            <Badge variant="secondary">{t("states.locked")}</Badge>
          )}
          {proposal.isManuallyEdited && (
            <Badge variant="warning">{t("states.edited")}</Badge>
          )}
        </div>
      </div>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex gap-2">
          <CalendarDays
            aria-hidden
            className="mt-0.5 size-4 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">{t("days")}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {proposal.daysOfWeek
                .map((day) => t(`weekDays.${day}`))
                .join(t("daySeparator"))}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Clock3 aria-hidden className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("time")}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {t("timeRange", {
                start: proposal.startTime,
                end: proposal.endTime,
              })}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <MapPin aria-hidden className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <dt className="text-xs text-muted-foreground">{t("location")}</dt>
            <dd className="mt-1 font-medium text-foreground">{location}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <UsersRound
            aria-hidden
            className="mt-0.5 size-4 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">{t("capacity")}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {t("people", {
                count: formatNumber(proposal.capacity, locale),
              })}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <Building2
            aria-hidden
            className="mt-0.5 size-4 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("deliveryMode")}
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {t(`deliveryModes.${proposal.deliveryMode}`)}
            </dd>
          </div>
        </div>
        <div className="flex gap-2">
          <GraduationCap
            aria-hidden
            className="mt-0.5 size-4 text-muted-foreground"
          />
          <div>
            <dt className="text-xs text-muted-foreground">{t("sessions")}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatNumber(proposal.sessions.length, locale)}
            </dd>
          </div>
        </div>
      </dl>

      {proposal.selectionReasons.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("selectionReasons")}
          </span>
          {proposal.selectionReasons.map((reason) => (
            <Badge key={reason.code} variant="outline">
              {t(`reasons.${reason.code}`)}
            </Badge>
          ))}
        </div>
      )}

      {proposal.warnings.length > 0 && (
        <div className="mt-4">
          <SchedulingWarningList
            warnings={proposal.warnings}
            ariaLabel={t("proposalWarnings")}
          />
        </div>
      )}
    </li>
  )
}
