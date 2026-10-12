"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  User,
  UserCheck,
  UserX,
} from "lucide-react"
import type {
  CourseLevelNode,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import {
  findFreeMastersForSlot,
  type FreeMasterItem,
} from "./helper/teacher-level-comparison.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface FreeMastersSelectionProps {
  proposal: Proposal | null
  targetCourse: CourseLevelNode
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  teacherCalendars?: SchedulingTeacherCalendar[]
  allProposals?: Proposal[]
  onAssignTeacher?: (
    proposal: Proposal,
    teacherId: string
  ) => Promise<void> | void
  isPending?: boolean
}

export function FreeMastersSelection({
  proposal,
  targetCourse,
  daysOfWeek,
  startTime,
  endTime,
  teacherCalendars = [],
  allProposals = [],
  onAssignTeacher,
  isPending = false,
}: FreeMastersSelectionProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [assigningTeacherId, setAssigningTeacherId] = React.useState<
    string | null
  >(null)

  const freeMasters = React.useMemo(() => {
    if (!daysOfWeek.length || !startTime || !endTime) return []
    return findFreeMastersForSlot({
      targetCourse,
      daysOfWeek,
      startTime,
      endTime,
      ignoredProposalId: proposal?.id,
      teacherCalendars,
      allProposals,
    })
  }, [
    targetCourse,
    daysOfWeek,
    startTime,
    endTime,
    proposal?.id,
    teacherCalendars,
    allProposals,
  ])

  const qualifiedCount = React.useMemo(
    () => freeMasters.filter((m) => m.comparison.isQualified).length,
    [freeMasters]
  )

  const handleAssign = async (teacherId: string) => {
    if (!proposal || !onAssignTeacher || isPending) return
    setAssigningTeacherId(teacherId)
    try {
      await onAssignTeacher(proposal, teacherId)
    } finally {
      setAssigningTeacherId(null)
    }
  }

  return (
    <section
      data-testid="free-masters-selection"
      className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <UserCheck aria-hidden className="size-4 shrink-0 text-primary" />
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {t("staffingFallback.freeMastersTitle")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("staffingFallback.freeMastersDescription")}
            </p>
          </div>
        </div>
        {qualifiedCount > 0 && (
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 text-xs font-semibold text-primary"
          >
            {t("staffingFallback.readyToAssignCount", {
              count: formatNumber(qualifiedCount, locale),
            })}
          </Badge>
        )}
      </div>

      {/* Content */}
      {freeMasters.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <UserX
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span>{t("staffingFallback.noFreeMastersDescription")}</span>
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {freeMasters.map((item) => (
            <FreeMasterCard
              key={item.teacher.id}
              item={item}
              proposal={proposal}
              isPending={isPending}
              isAssigning={assigningTeacherId === item.teacher.id}
              onAssign={handleAssign}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface FreeMasterCardProps {
  item: FreeMasterItem
  proposal: Proposal | null
  isPending: boolean
  isAssigning: boolean
  onAssign: (teacherId: string) => void
}

function FreeMasterCard({
  item,
  proposal,
  isPending,
  isAssigning,
  onAssign,
}: FreeMasterCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const teacherFullName =
    `${item.teacher.firstName} ${item.teacher.lastName}`.trim()
  const isQualified = item.comparison.isQualified

  return (
    <li
      data-testid={`free-master-item-${item.teacher.id}`}
      data-qualified={isQualified ? "true" : "false"}
      data-level-status={item.comparison.status}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        isQualified
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border/50 bg-muted/20 opacity-75"
      )}
    >
      {/* Teacher Profile & Level Badges */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/80">
          {item.teacher.avatarUrl ? (
            <Image
              src={getAssetUrl(item.teacher.avatarUrl)}
              alt={teacherFullName}
              width={36}
              height={36}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <User aria-hidden className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {teacherFullName}
            </span>
            {/* Level Comparison Badge */}
            {item.comparison.status === "DIRECT_MATCH" && (
              <Badge
                variant="outline"
                className="gap-1 border-success/40 bg-success/10 text-xs text-success"
              >
                <Check aria-hidden className="size-3 text-success" />
                <span>{t("staffingFallback.directMatchBadge")}</span>
              </Badge>
            )}
            {item.comparison.status === "HIGHER_LEVEL" && (
              <Badge
                variant="outline"
                className="gap-1 border-primary/40 bg-primary/10 text-xs text-primary"
              >
                <ArrowUpRight aria-hidden className="size-3 text-primary" />
                <span>
                  {t("staffingFallback.higherLevelBadge", {
                    course: item.comparison.higherCourse.title,
                  })}
                </span>
              </Badge>
            )}
            {item.comparison.status === "LOWER_LEVEL" && (
              <Badge
                variant="outline"
                className="gap-1 border-warning/40 bg-warning/10 text-xs text-warning-foreground"
              >
                <ArrowDownRight
                  aria-hidden
                  className="size-3 text-warning-foreground"
                />
                <span>
                  {t("staffingFallback.lowerLevelBadge", {
                    course: item.comparison.lowerCourse.title,
                  })}
                </span>
              </Badge>
            )}
            {item.comparison.status === "UNRELATED" && (
              <Badge
                variant="outline"
                className="border-border/80 bg-muted/40 text-xs text-muted-foreground"
              >
                <span>{t("staffingFallback.unrelatedLevelBadge")}</span>
              </Badge>
            )}
          </div>

          {/* Teachable Courses Range */}
          {item.courseRangeSummary && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">
                {t("staffingFallback.teachableCoursesLabel")}{" "}
              </span>
              <span>{item.courseRangeSummary}</span>
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          data-testid={`assign-free-master-btn-${item.teacher.id}`}
          disabled={!isQualified || !proposal || isPending}
          onClick={() => onAssign(item.teacher.id)}
          className="shrink-0 gap-1.5 font-medium"
        >
          {isAssigning ? (
            <Spinner className="size-4" />
          ) : (
            <>
              <Check aria-hidden className="size-3.5" />
              <span>{t("staffingFallback.assignMaster")}</span>
            </>
          )}
        </Button>
      </div>
    </li>
  )
}
