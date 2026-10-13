"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { UserCheck } from "lucide-react"
import type {
  CourseLevelNode,
  SchedulingPlanDetailsDto,
  SchedulingTeacherCalendar,
  WeekDay,
} from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { NewTeacherAssignment } from "../../../scheduling-new-teacher-assignment-list"
import { SchedulingStaffingSectionHeader } from "../../../scheduling-staffing-section-header"
import { FreeMasterCard } from "./free-master-card"
import { findFreeMastersForSlot } from "./helper/teacher-level-comparison.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface FreeMastersSelectionProps {
  branchNumber?: number
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
  branchNumber,
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

  if (freeMasters.length === 0) {
    return null
  }

  const hasMultiple = freeMasters.length > 1

  return (
    <section
      data-testid="free-masters-selection"
      className="rounded-2xl border border-border/70 bg-card p-4 shadow-2xs transition-colors sm:p-5"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          containScroll: "trimSnaps",
          direction: locale === "fa" ? "rtl" : "ltr",
        }}
        className="w-full"
      >
        <SchedulingStaffingSectionHeader
          branchNumber={branchNumber}
          icon={UserCheck}
          title={t("staffingFallback.freeMastersTitle")}
          badgeLabel={
            qualifiedCount > 0
              ? t("staffingFallback.readyToAssignCount", {
                  count: formatNumber(qualifiedCount, locale),
                })
              : null
          }
          badgeVariant="outline"
          badgeClassName="border-primary/40 bg-primary/10 text-primary"
          total={freeMasters.length}
          counterText={t("staffingFallback.teacherCarouselCounter", {
            current: formatNumber(current, locale),
            total: formatNumber(freeMasters.length, locale),
          })}
        />

        <CarouselContent className="-ms-3 mt-3">
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
    </section>
  )
}
