"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { UserCheck, UserX } from "lucide-react"
import type {
  CourseLevelNode,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../../scheduling-new-teacher-assignment-list"
import { FreeMasterCard } from "./free-master-card"
import { findFreeMastersForSlot } from "./helper/teacher-level-comparison.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface FreeMastersSelectionProps {
  proposal: Proposal | null
  hiringAssignment?: NewTeacherAssignment | null
  targetCourse: CourseLevelNode
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
  teacherCalendars?: SchedulingTeacherCalendar[]
  allProposals?: Proposal[]
  targetBranchId?: string | null
  onAssignTeacher?: (
    proposal: Proposal,
    teacherId: string
  ) => Promise<void> | void
  onAssignMissedClassTeacher?: (
    assignment: NewTeacherAssignment,
    teacherId: string
  ) => Promise<void> | void
  isPending?: boolean
}

export function FreeMastersSelection({
  proposal,
  hiringAssignment,
  targetCourse,
  daysOfWeek,
  startTime,
  endTime,
  teacherCalendars = [],
  allProposals = [],
  targetBranchId,
  onAssignTeacher,
  onAssignMissedClassTeacher,
  isPending = false,
}: FreeMastersSelectionProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [assigningTeacherId, setAssigningTeacherId] = React.useState<
    string | null
  >(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)

  const effectiveBranchId =
    targetBranchId ??
    proposal?.branch?.id ??
    (proposal as { branchId?: string | null } | undefined)?.branchId ??
    hiringAssignment?.branchId ??
    null

  const freeMasters = React.useMemo(() => {
    if (!daysOfWeek.length || !startTime || !endTime) return []
    const all = findFreeMastersForSlot({
      targetCourse,
      daysOfWeek,
      startTime,
      endTime,
      ignoredProposalId: proposal?.id,
      teacherCalendars,
      allProposals,
      targetBranchId: effectiveBranchId,
    })
    return all.filter((m) => !m.isOtherBranch)
  }, [
    targetCourse,
    daysOfWeek,
    startTime,
    endTime,
    proposal?.id,
    teacherCalendars,
    allProposals,
    effectiveBranchId,
  ])

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap() + 1)

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1)
    }

    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const qualifiedCount = React.useMemo(
    () => freeMasters.filter((m) => m.comparison.isQualified).length,
    [freeMasters]
  )

  const canAssign = Boolean(
    (proposal && onAssignTeacher) ||
    (hiringAssignment && onAssignMissedClassTeacher)
  )

  const handleAssign = async (teacherId: string) => {
    if (!canAssign || isPending) return
    setAssigningTeacherId(teacherId)
    try {
      if (proposal && onAssignTeacher) {
        await onAssignTeacher(proposal, teacherId)
      } else if (hiringAssignment && onAssignMissedClassTeacher) {
        await onAssignMissedClassTeacher(hiringAssignment, teacherId)
      }
    } finally {
      setAssigningTeacherId(null)
    }
  }

  const hasMultiple = freeMasters.length > 1

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
        <div className="mt-3 w-full">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              direction: locale === "fa" ? "rtl" : "ltr",
            }}
            className="w-full"
          >
            {hasMultiple && (
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("staffingFallback.teacherCarouselCounter", {
                    current: formatNumber(current, locale),
                    total: formatNumber(freeMasters.length, locale),
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <CarouselPrevious
                    type="button"
                    className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                  />
                  <CarouselNext
                    type="button"
                    className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                  />
                </div>
              </div>
            )}

            <CarouselContent className="-ms-3">
              {freeMasters.map((item) => (
                <CarouselItem
                  key={item.teacher.id}
                  data-testid="free-master-slide"
                  className={cn(
                    "ps-3",
                    hasMultiple ? "basis-[90%] sm:basis-[85%]" : "basis-full"
                  )}
                >
                  <FreeMasterCard
                    item={item}
                    canAssign={canAssign}
                    isPending={isPending}
                    isAssigning={assigningTeacherId === item.teacher.id}
                    onAssign={handleAssign}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </section>
  )
}
