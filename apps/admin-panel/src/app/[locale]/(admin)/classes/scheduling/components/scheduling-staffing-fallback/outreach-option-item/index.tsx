"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import type { SchedulingTeacherOutreachOption } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn, formatNumber, getAssetUrl } from "@workspace/ui/lib/utils"
import { OutreachPeriodItem } from "../outreach-period-item"

export interface TeacherOutreachGroup {
  teacher: SchedulingTeacherOutreachOption["teacher"]
  higherLevelCourseTitle?: string | null
  options: SchedulingTeacherOutreachOption[]
}

export interface OutreachOptionItemProps {
  group?: TeacherOutreachGroup
  option?: SchedulingTeacherOutreachOption
  index?: number
  canToggle: boolean
  isPending: ((key: string) => boolean) | boolean
  pendingAction?: "ACCEPT" | "REJECT" | null
  onToggle: (
    option: SchedulingTeacherOutreachOption,
    action: "ACCEPT" | "REJECT"
  ) => void
}

export function OutreachOptionItem({
  group: providedGroup,
  option: providedOption,
  canToggle,
  isPending,
  pendingAction,
  onToggle,
}: OutreachOptionItemProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const group = providedGroup ?? {
    teacher: providedOption!.teacher,
    higherLevelCourseTitle: providedOption!.higherLevelCourseTitle ?? null,
    options: providedOption ? [providedOption] : [],
  }

  const { teacher, higherLevelCourseTitle, options } = group
  const teacherName = `${teacher.firstName} ${teacher.lastName}`.trim()
  const checkPending =
    typeof isPending === "function" ? isPending : () => isPending

  const hasAnyAccepted = options.some((opt) => Boolean(opt.isAccepted))
  const hasAllRejected =
    options.length > 0 && options.every((opt) => Boolean(opt.isRejected))

  return (
    <div
      data-testid={`outreach-teacher-group-${teacher.id}`}
      className={cn(
        "flex flex-col justify-between rounded-2xl border p-4 transition-all sm:p-5",
        hasAnyAccepted
          ? "border-success/40 bg-success/5 shadow-xs"
          : hasAllRejected
            ? "border-destructive/40 bg-destructive/5 shadow-xs"
            : "border-border/60 bg-card hover:border-border hover:shadow-xs"
      )}
    >
      {/* Teacher Header: Avatar, Name, Qualification, and Periods Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
            {teacher.avatarUrl ? (
              <Image
                src={getAssetUrl(teacher.avatarUrl)}
                alt={teacherName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                {teacher.firstName[0]}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-foreground">
              {teacherName}
            </h4>
            {higherLevelCourseTitle ? (
              <Badge variant="secondary" className="text-xs">
                {t("staffingFallback.higherLevelTeacherBadge")}:{" "}
                {higherLevelCourseTitle}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {t("staffingFallback.outreachBadge")}
              </Badge>
            )}
          </div>
        </div>

        <Badge variant="secondary" className="text-xs font-medium">
          {t("staffingFallback.teacherPeriodsCount", {
            count: formatNumber(options.length, locale),
          })}
        </Badge>
      </div>

      {/* Suggested Periods Carousel for this Teacher */}
      <div className="mt-3.5 w-full">
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            direction: locale === "fa" ? "rtl" : "ltr",
          }}
          className="w-full"
        >
          {options.length > 2 && (
            <div className="mb-2 flex items-center justify-end gap-1">
              <CarouselPrevious
                type="button"
                className="static size-6 translate-x-0 translate-y-0 scale-100 rounded-md border-border/80 bg-muted/40 p-0 text-muted-foreground opacity-100 shadow-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              />
              <CarouselNext
                type="button"
                className="static size-6 translate-x-0 translate-y-0 scale-100 rounded-md border-border/80 bg-muted/40 p-0 text-muted-foreground opacity-100 shadow-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              />
            </div>
          )}
          <CarouselContent className="-ms-2.5">
            {options.map((opt, optIndex) => (
              <CarouselItem
                key={opt.key}
                data-testid="outreach-period-slide"
                className={cn(
                  "ps-2.5",
                  options.length === 1
                    ? "basis-full"
                    : "basis-[85%] sm:basis-[40%]"
                )}
              >
                <OutreachPeriodItem
                  option={opt}
                  index={optIndex}
                  totalInGroup={options.length}
                  canToggle={canToggle}
                  isPending={checkPending(opt.key)}
                  pendingAction={checkPending(opt.key) ? pendingAction : null}
                  onToggle={onToggle}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}
