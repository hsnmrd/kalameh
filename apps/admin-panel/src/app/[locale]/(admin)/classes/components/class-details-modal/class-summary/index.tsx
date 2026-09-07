"use client"

import { useTranslations } from "next-intl"
import { Building, DoorOpen, GraduationCap, Layers, Users } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { ClassDto } from "@workspace/types"
import { Metric } from "./metric"

interface ClassSummaryProps {
  cls: ClassDto
  locale: string
  enrolled: number
  capacity: number
  fillPercent: number
  isFull: boolean
}

export function ClassSummary({
  cls,
  locale,
  enrolled,
  capacity,
  fillPercent,
  isFull,
}: ClassSummaryProps) {
  const t = useTranslations("classes")
  return (
    <>
      <div className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-muted/20 p-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground sm:text-lg">
            {cls.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{cls.course?.title || "-"}</span>
            {cls.term?.title && (
              <>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {cls.term.title}
                </span>
              </>
            )}
            {cls.term?.isActive && (
              <Badge
                variant="outline"
                className="h-4 border-success/30 bg-success/15 px-1.5 text-[10px] font-medium text-success"
              >
                {t("createModal.activeTermBadge")}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric
          icon={<GraduationCap className="size-4 text-muted-foreground" />}
          label={t("detailsModal.teacher")}
        >
          <span className="block truncate text-sm font-semibold text-foreground">
            {cls.teacherName || t("detailsModal.noTeacher")}
          </span>
        </Metric>
        <Metric
          icon={
            <span className="text-xs font-bold text-muted-foreground">
              {locale === "fa" ? "ت" : "$"}
            </span>
          }
          label={t("detailsModal.tuition")}
        >
          <Price
            amount={cls.fee}
            locale={locale}
            className="text-sm font-semibold text-foreground"
          />
        </Metric>
        <Metric
          icon={<Users className="size-4 text-muted-foreground" />}
          label={t("detailsModal.enrollment")}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {formatNumber(enrolled, locale)} /{" "}
              {formatNumber(capacity, locale)}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-4 px-1.5 text-[10px] font-medium",
                isFull
                  ? "border-destructive/30 bg-destructive/15 text-destructive"
                  : "border-success/30 bg-success/15 text-success"
              )}
            >
              {fillPercent}%
            </Badge>
          </div>
        </Metric>
        <Metric
          icon={<Building className="size-4 text-muted-foreground" />}
          label={t("detailsModal.branch")}
        >
          <span className="block truncate text-sm font-semibold text-foreground">
            {cls.branch?.name || t("detailsModal.noBranch")}
          </span>
          {cls.classroom?.name && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <DoorOpen className="size-3 text-muted-foreground" />
              <span>{cls.classroom.name}</span>
            </span>
          )}
        </Metric>
      </div>
    </>
  )
}
