"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { UserPlus } from "lucide-react"
import type { SchedulingTeacherOutreachOption, WeekDay } from "@workspace/types"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingStaffingSectionHeader } from "../../scheduling-staffing-section-header"
import {
  OutreachOptionItem,
  type TeacherOutreachGroup,
} from "../outreach-option-item"

export interface OutreachCarouselProps {
  branchNumber?: number
  options: SchedulingTeacherOutreachOption[]
  canToggle: boolean
  isPending: (key: string) => boolean
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

export function OutreachCarousel({
  branchNumber,
  options,
  canToggle,
  isPending,
  pendingAction,
  currentSchedule,
  onToggle,
}: OutreachCarouselProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)

  const teacherGroups = React.useMemo<TeacherOutreachGroup[]>(() => {
    const groupsMap = new Map<string, TeacherOutreachGroup>()
    for (const option of options) {
      const teacherId = option.teacher.id
      const existing = groupsMap.get(teacherId)
      if (existing) {
        existing.options.push(option)
        if (!existing.higherLevelCourseTitle && option.higherLevelCourseTitle) {
          existing.higherLevelCourseTitle = option.higherLevelCourseTitle
        }
      } else {
        groupsMap.set(teacherId, {
          teacher: option.teacher,
          higherLevelCourseTitle: option.higherLevelCourseTitle ?? null,
          isBankTeacher: option.key.startsWith("bank-"),
          options: [option],
        })
      }
    }
    return Array.from(groupsMap.values())
  }, [options])

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

  if (teacherGroups.length === 0) return null

  const hasMultiple = teacherGroups.length > 1

  return (
    <div className="w-full">
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
          icon={UserPlus}
          title={t("staffingFallback.title")}
          badgeLabel={t("staffingFallback.solutionsCount", {
            count: formatNumber(teacherGroups.length, locale),
          })}
          badgeVariant="secondary"
          total={teacherGroups.length}
          counterText={t("staffingFallback.teacherCarouselCounter", {
            current: formatNumber(current, locale),
            total: formatNumber(teacherGroups.length, locale),
          })}
        />

        <CarouselContent className="-ms-3 mt-3">
          {teacherGroups.map((group, index) => (
            <CarouselItem
              key={group.teacher.id}
              data-testid="outreach-teacher-slide"
              className={cn("ps-3", hasMultiple ? "basis-[90%]" : "basis-full")}
            >
              <OutreachOptionItem
                group={group}
                index={index}
                canToggle={canToggle}
                isPending={isPending}
                pendingAction={pendingAction}
                currentSchedule={currentSchedule}
                onToggle={onToggle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
