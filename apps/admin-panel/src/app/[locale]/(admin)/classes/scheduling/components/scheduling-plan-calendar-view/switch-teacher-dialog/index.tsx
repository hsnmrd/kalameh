"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftRight, Check, Clock, GraduationCap, User } from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import {
  isTeacherAvailableForSchedule,
  isTeacherQualifiedForCourse,
} from "../helper/swap-eligibility.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface SwitchTeacherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: Proposal | null
  teacherCalendars?: SchedulingTeacherCalendar[]
  proposals: Proposal[]
  onSwitchTeacher: (
    proposal: Proposal,
    targetTeacherId: string,
    swapWithProposal?: Proposal
  ) => Promise<void> | void
  isPending?: boolean
}

function doTimesOverlap(p1: Proposal, p2: Proposal): boolean {
  const shareDay = p1.daysOfWeek.some((d) => p2.daysOfWeek.includes(d))
  if (!shareDay) return false
  return p1.startTime < p2.endTime && p2.startTime < p1.endTime
}

export function SwitchTeacherDialog({
  open,
  onOpenChange,
  proposal,
  teacherCalendars = [],
  proposals,
  onSwitchTeacher,
  isPending = false,
}: SwitchTeacherDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    if (!open) {
      setSelectedTeacherId(null)
    }
  }, [open])

  if (!proposal) return null

  const currentTeacherId = proposal.teacherId ?? proposal.teacher?.id ?? null
  const currentTeacherName = proposal.teacher
    ? `${proposal.teacher.firstName} ${proposal.teacher.lastName}`
    : t("calendarView.newTeacherBadge")

  // Find all proposals overlapping with the current proposal's time period (excluding itself)
  const overlappingProposals = proposals.filter(
    (p) => p.id !== proposal.id && doTimesOverlap(p, proposal)
  )

  // Map of teacherId -> overlapping Proposal
  const overlappingProposalByTeacherId = new Map<string, Proposal>()
  for (const op of overlappingProposals) {
    const tid = op.teacherId ?? op.teacher?.id
    if (tid) {
      overlappingProposalByTeacherId.set(tid, op)
    }
  }

  // Collect all potential teachers: from teacherCalendars plus any teacher assigned in overlapping proposals or current proposal
  const candidateTeachersMap = new Map<
    string,
    SchedulingTeacherCalendar["teacher"]
  >()
  for (const cal of teacherCalendars) {
    candidateTeachersMap.set(cal.teacher.id, cal.teacher)
  }
  if (proposal.teacher && !candidateTeachersMap.has(proposal.teacher.id)) {
    candidateTeachersMap.set(proposal.teacher.id, {
      id: proposal.teacher.id,
      firstName: proposal.teacher.firstName,
      lastName: proposal.teacher.lastName,
      avatarUrl: proposal.teacher.avatarUrl ?? null,
    })
  }
  for (const op of overlappingProposals) {
    if (op.teacher && !candidateTeachersMap.has(op.teacher.id)) {
      candidateTeachersMap.set(op.teacher.id, {
        id: op.teacher.id,
        firstName: op.teacher.firstName,
        lastName: op.teacher.lastName,
        avatarUrl: op.teacher.avatarUrl ?? null,
      })
    }
  }

  // Filter teachers: ONLY show masters who are present in that specific period of time:
  // 1. Current teacher
  // 2. Swappable teacher: teaching another proposal in this period
  // 3. Free teacher: available according to their calendar slots
  const teacherItems = Array.from(candidateTeachersMap.values())
    .map((teacher) => {
      const isCurrent = teacher.id === currentTeacherId
      const occupyingProposal =
        overlappingProposalByTeacherId.get(teacher.id) ?? null

      if (isCurrent) {
        return {
          teacher,
          isCurrent: true,
          type: "CURRENT" as const,
          isClickable: false,
          occupyingProposal: null,
          isQualified: true,
        }
      }

      if (occupyingProposal) {
        const isQualified = isTeacherQualifiedForCourse(
          teacher.id,
          proposal.course,
          proposals,
          teacherCalendars
        )
        return {
          teacher,
          isCurrent: false,
          type: "SWAPPABLE" as const,
          isClickable: true,
          occupyingProposal,
          isQualified,
        }
      }

      // Check if teacher is free in this period
      const isFree = isTeacherAvailableForSchedule(
        teacher.id,
        proposal.daysOfWeek,
        proposal.startTime,
        proposal.endTime,
        [proposal.id],
        proposals,
        teacherCalendars
      )

      if (isFree) {
        const isQualified = isTeacherQualifiedForCourse(
          teacher.id,
          proposal.course,
          proposals,
          teacherCalendars
        )
        return {
          teacher,
          isCurrent: false,
          type: "FREE" as const,
          isClickable: true,
          occupyingProposal: null,
          isQualified,
        }
      }

      // Not present in this period: exclude completely
      return null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      if (a.type === "FREE" && b.type !== "FREE") return -1
      if (a.type !== "FREE" && b.type === "FREE") return 1
      return (a.teacher.lastName ?? "").localeCompare(b.teacher.lastName ?? "")
    })

  const handleSelectTeacher = async (
    targetTeacherId: string,
    occupyingProposal?: Proposal | null
  ) => {
    if (isPending) return
    setSelectedTeacherId(targetTeacherId)
    try {
      await onSwitchTeacher(
        proposal,
        targetTeacherId,
        occupyingProposal ?? undefined
      )
      onOpenChange(false)
    } finally {
      setSelectedTeacherId(null)
    }
  }

  const formatSchedule = () => {
    const days = proposal.daysOfWeek
      .map((d) => t(`weekDays.${d}`))
      .join(t("daySeparator"))
    return `${days} · ${proposal.startTime} - ${proposal.endTime}`
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        data-testid="switch-teacher-dialog"
        className="max-w-lg overflow-hidden p-0 sm:max-w-lg"
      >
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle className="text-base font-semibold">
            {t("calendarView.switchTeacherTitle")} · {proposal.course.title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Current session info banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/80">
                {proposal.teacher?.avatarUrl ? (
                  <Image
                    src={getAssetUrl(proposal.teacher.avatarUrl)}
                    alt={currentTeacherName}
                    width={24}
                    height={24}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <User
                    aria-hidden
                    className="size-3.5 text-muted-foreground"
                  />
                )}
              </div>
              <span className="font-semibold">
                {t("calendarView.currentTeacherBadge")}:
              </span>
              <span>{currentTeacherName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock aria-hidden className="size-3.5 shrink-0" />
              <span>{formatSchedule()}</span>
            </div>
          </div>

          {/* List of present masters */}
          {teacherItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <GraduationCap aria-hidden className="size-8 opacity-40" />
              <p className="text-sm font-medium">
                {t("calendarView.noTeachersPresent")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teacherItems.map(
                ({
                  teacher,
                  isCurrent,
                  type,
                  isClickable,
                  occupyingProposal,
                  isQualified,
                }) => {
                  const isSelectedPending =
                    isPending && selectedTeacherId === teacher.id
                  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`

                  return (
                    <div
                      key={teacher.id}
                      data-testid={`teacher-item-${teacher.id}`}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border p-3 transition-all",
                        isCurrent
                          ? "border-primary/40 bg-primary/5"
                          : type === "FREE"
                            ? "border-border/60 bg-card hover:border-success/60 hover:bg-success/5"
                            : "border-border/60 bg-card hover:border-primary/60 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/80">
                            {teacher.avatarUrl ? (
                              <Image
                                src={getAssetUrl(teacher.avatarUrl)}
                                alt={teacherFullName}
                                width={32}
                                height={32}
                                unoptimized
                                className="size-full object-cover"
                              />
                            ) : (
                              <User
                                aria-hidden
                                className={cn(
                                  "size-4 shrink-0",
                                  isCurrent
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">
                                {teacherFullName}
                              </span>
                              {!isQualified && (
                                <Badge
                                  variant="outline"
                                  className="border-warning/60 text-[10px] text-warning"
                                >
                                  {t("unresolvedReasons.NO_QUALIFIED_TEACHER")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              {t("calendarView.currentTeacherBadge")}
                            </Badge>
                          )}
                          {type === "FREE" && (
                            <Badge variant="success" className="text-xs">
                              {t("calendarView.freeTeacherBadge")}
                            </Badge>
                          )}
                          {type === "SWAPPABLE" && (
                            <Badge variant="default" className="gap-1 text-xs">
                              <ArrowLeftRight aria-hidden className="size-3" />
                              {t("calendarView.swappableTeacherBadge")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Occupying proposal information */}
                      {occupyingProposal && (
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                          <span>
                            {t("calendarView.swapTeacherWith", {
                              title:
                                occupyingProposal.course?.title ??
                                occupyingProposal.title,
                            })}
                          </span>
                        </div>
                      )}

                      {/* Action button */}
                      {!isCurrent && (
                        <div className="mt-1 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            data-testid={`switch-teacher-btn-${teacher.id}`}
                            variant={type === "FREE" ? "default" : "outline"}
                            disabled={!isClickable || isPending}
                            onClick={() =>
                              handleSelectTeacher(teacher.id, occupyingProposal)
                            }
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                          >
                            {isSelectedPending ? (
                              <Spinner className="size-3.5" />
                            ) : type === "SWAPPABLE" ? (
                              <>
                                <ArrowLeftRight
                                  aria-hidden
                                  className="size-3.5"
                                />
                                <span>{t("calendarView.swapWithTeacher")}</span>
                              </>
                            ) : (
                              <>
                                <Check aria-hidden className="size-3.5" />
                                <span>{t("calendarView.selectTeacher")}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
