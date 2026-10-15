"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Layers } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { BookCoursePreviewCard } from "./book-course-preview-card"

export interface BookCoursePreviewItem {
  title: string
  prerequisiteText: string
}

export interface BookCoursesPreviewCarouselProps {
  items: BookCoursePreviewItem[]
}

export function BookCoursesPreviewCarousel({
  items,
}: BookCoursesPreviewCarouselProps) {
  const t = useTranslations("courses")

  if (!items.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4">
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Layers className="size-3.5 text-muted-foreground" />
            <span>{t("createGroupModal.previewCourses")}</span>
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
              className="flex shrink-0 basis-[240px] ps-2 sm:basis-[260px]"
            >
              <BookCoursePreviewCard
                index={idx + 1}
                title={item.title}
                prerequisiteText={item.prerequisiteText}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
