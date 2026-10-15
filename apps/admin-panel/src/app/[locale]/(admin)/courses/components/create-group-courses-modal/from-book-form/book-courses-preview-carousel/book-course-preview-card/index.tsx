"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useIsRtl } from "@/i18n/routing"

export interface BookCoursePreviewCardProps {
  index: number
  title: string
  prerequisiteText: string
}

export function BookCoursePreviewCard({
  index,
  title,
  prerequisiteText,
}: BookCoursePreviewCardProps) {
  const t = useTranslations("courses")
  const isRtl = useIsRtl()
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="flex h-full w-full flex-col justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
      {/* Course Title (Upper Section) */}
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {index}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("createGroupModal.courseTitleLabel")}
          </span>
          <span
            className="truncate text-sm font-semibold text-foreground"
            title={title}
          >
            {title}
          </span>
        </div>
      </div>

      {/* Prerequisite (ALWAYS Below Title) */}
      <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/40 p-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <ArrowIcon className="size-3 shrink-0 text-muted-foreground" />
          <span>{t("createGroupModal.prereqLabel")}</span>
        </span>
        <span
          className="truncate font-semibold text-foreground"
          title={prerequisiteText}
        >
          {prerequisiteText}
        </span>
      </div>
    </div>
  )
}
