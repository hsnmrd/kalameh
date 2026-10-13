"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Building2, CheckCircle2, Clock } from "lucide-react"
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
import { FreeMasterCard } from "../../free-masters-selection/free-master-card"
import type { FreeMasterItem } from "../../free-masters-selection/helper/teacher-level-comparison.helper"

export interface BranchGroupCardProps {
  branchId: string
  branchName: string
  hasDefinedSchedule: boolean
  scheduleStatus: "NOT_SCHEDULED" | "SCHEDULED" | "PUBLISHED"
  masters: FreeMasterItem[]
  canAssign: boolean
  isPending: boolean
  assigningTeacherId: string | null
  onAssign: (teacherId: string) => void
}

export function BranchGroupCard({
  branchId,
  branchName,
  hasDefinedSchedule,
  scheduleStatus,
  masters,
  canAssign,
  isPending,
  assigningTeacherId,
  onAssign,
}: BranchGroupCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)

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

  const hasMultiple = masters.length > 1
  const isScheduleDefined =
    hasDefinedSchedule ||
    scheduleStatus === "SCHEDULED" ||
    scheduleStatus === "PUBLISHED"

  return (
    <div
      data-testid={`other-branch-group-${branchId}`}
      className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3.5"
    >
      {/* Branch Header with Name and Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <Building2
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="text-xs font-bold text-foreground">
            {branchName}
          </span>
          <Badge variant="secondary" className="text-[11px] font-normal">
            {t("staffingFallback.otherBranchTeacherCount", {
              count: formatNumber(masters.length, locale),
            })}
          </Badge>
        </div>

        <div>
          {scheduleStatus === "PUBLISHED" ? (
            <Badge
              variant="outline"
              className="gap-1 border-success/40 bg-success/10 text-xs font-semibold text-success"
            >
              <CheckCircle2 aria-hidden className="size-3 text-success" />
              <span>{t("staffingFallback.otherBranchPublishedBadge")}</span>
            </Badge>
          ) : isScheduleDefined ? (
            <Badge
              variant="outline"
              className="gap-1 border-success/40 bg-success/10 text-xs font-semibold text-success"
            >
              <CheckCircle2 aria-hidden className="size-3 text-success" />
              <span>{t("staffingFallback.otherBranchScheduledBadge")}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-warning/40 bg-warning/10 text-xs font-semibold text-warning-foreground"
            >
              <Clock aria-hidden className="size-3 text-warning-foreground" />
              <span>{t("staffingFallback.otherBranchNotScheduledBadge")}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Decision Guidance Notice */}
      <p className="text-xs text-muted-foreground">
        {isScheduleDefined
          ? t("staffingFallback.otherBranchSafeNotice")
          : t("staffingFallback.otherBranchUnsafeNotice")}
      </p>

      {/* Masters List or Carousel */}
      {masters.length === 1 ? (
        <FreeMasterCard
          item={masters[0]!}
          canAssign={canAssign}
          isPending={isPending}
          isAssigning={assigningTeacherId === masters[0]!.teacher.id}
          onAssign={onAssign}
        />
      ) : (
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
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("staffingFallback.teacherCarouselCounter", {
                  current: formatNumber(current, locale),
                  total: formatNumber(masters.length, locale),
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
            {masters.map((item) => (
              <CarouselItem
                key={item.teacher.id}
                data-testid="other-branch-master-slide"
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
                  onAssign={onAssign}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </div>
  )
}
