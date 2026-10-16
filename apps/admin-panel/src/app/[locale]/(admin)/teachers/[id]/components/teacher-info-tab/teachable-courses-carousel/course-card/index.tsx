"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, GraduationCap } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { formatCourseShortTitle, formatNumber } from "@workspace/ui/lib/utils"
import type { TeacherCourseQualification } from "@workspace/types"

export interface CourseCardProps {
  qualification: TeacherCourseQualification
  index: number
  locale: string
}

export function CourseCard({ qualification, index, locale }: CourseCardProps) {
  const t = useTranslations("teachers")
  const courseTitle = qualification.course?.title || ""
  const shortTitle = formatCourseShortTitle(courseTitle)

  return (
    <div className="flex h-full min-h-[128px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-2xs">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-foreground">
            <GraduationCap className="size-4 text-foreground" />
          </div>
          {shortTitle ? (
            <Badge
              variant="outline"
              className="h-6 shrink-0 border-border/70 px-2 text-[11px] font-semibold text-foreground"
            >
              {shortTitle}
            </Badge>
          ) : null}
        </div>
        <p
          className="mt-3 line-clamp-2 text-sm leading-snug font-bold text-foreground"
          title={courseTitle}
        >
          {courseTitle}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 text-[11px] font-medium text-foreground">
          <CheckCircle2 className="size-3 text-foreground" />
          <span>{t("qualifications.authorizedBadge")}</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          #{formatNumber(index + 1, locale)}
        </span>
      </div>
    </div>
  )
}
