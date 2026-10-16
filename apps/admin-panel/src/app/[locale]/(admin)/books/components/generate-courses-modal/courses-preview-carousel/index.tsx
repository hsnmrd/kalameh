"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, Layers } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { useIsRtl } from "@/i18n/routing"

export interface CoursePreviewItem {
  title: string
  prerequisiteText: string
}

export interface CoursesPreviewCarouselProps {
  items: CoursePreviewItem[]
}

export function CoursesPreviewCarousel({ items }: CoursesPreviewCarouselProps) {
  const t = useTranslations("books")
  const isRtl = useIsRtl()
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  if (!items.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Layers className="size-3.5 text-muted-foreground" />
            <span>{t("generateCoursesModal.previewTitle")}</span>
          </span>
          <div className="flex items-center gap-1">
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

        <CarouselContent className="-ms-2 items-stretch">
          {items.map((item, idx) => (
            <CarouselItem
              key={item.title}
              className="flex shrink-0 basis-[260px] ps-2 sm:basis-[280px]"
            >
              <div className="flex h-full w-full flex-col justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                {/* Course Title (Upper Section) */}
                <div className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t("generateCoursesModal.courseTitleLabel")}
                    </span>
                    <span
                      className="truncate text-sm font-semibold text-foreground"
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>
                </div>

                {/* Prerequisite (ALWAYS Below Title) */}
                <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/40 p-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <ArrowIcon className="size-3 shrink-0 text-muted-foreground" />
                    <span>{t("generateCoursesModal.prereqLabel")}</span>
                  </span>
                  <span
                    className="truncate font-semibold text-foreground"
                    title={item.prerequisiteText}
                  >
                    {item.prerequisiteText}
                  </span>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
