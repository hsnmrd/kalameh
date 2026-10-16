"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { BookOpen, Search, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { TeacherCourseQualification } from "@workspace/types"
import { CourseCard } from "./course-card"
import { EmptyState } from "./empty-state"

export interface TeachableCoursesCarouselProps {
  teachableCourses: TeacherCourseQualification[]
}

export function TeachableCoursesCarousel({
  teachableCourses,
}: TeachableCoursesCarouselProps) {
  const t = useTranslations("teachers")
  const locale = useLocale()
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredCourses = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return teachableCourses
    return teachableCourses.filter((qualification) => {
      const title = qualification.course?.title?.toLowerCase() || ""
      return title.includes(q)
    })
  }, [teachableCourses, searchQuery])

  React.useEffect(() => {
    if (!api) return

    const updateStats = () => {
      setCount(api.scrollSnapList().length)
      setCurrent(api.selectedScrollSnap() + 1)
    }

    updateStats()
    api.on("select", updateStats)
    api.on("reInit", updateStats)

    return () => {
      api.off("select", updateStats)
      api.off("reInit", updateStats)
    }
  }, [api])

  if (teachableCourses.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
            <BookOpen className="size-4 text-muted-foreground" />
            <span>{t("qualifications.profileTitle")}</span>
            <Badge
              variant="secondary"
              className="h-6 px-2.5 text-xs font-medium"
            >
              {t("qualifications.coursesCount", {
                count: formatNumber(0, locale),
              })}
            </Badge>
          </h3>
        </div>
        <div className="mt-4">
          <EmptyState />
        </div>
      </div>
    )
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: "start",
        dragFree: true,
      }}
      className="w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
          <BookOpen className="size-4 text-muted-foreground" />
          <span>{t("qualifications.profileTitle")}</span>
          <Badge variant="secondary" className="h-6 px-2.5 text-xs font-medium">
            {t("qualifications.coursesCount", {
              count: formatNumber(teachableCourses.length, locale),
            })}
          </Badge>
        </h3>

        <div className="flex items-center gap-2">
          {teachableCourses.length > 5 ? (
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("qualifications.searchCourses")}
                className="h-8 w-36 rounded-xl border-border/70 bg-card ps-8 pe-7 text-xs sm:w-44"
              />
              {searchQuery ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute end-1 top-1/2 size-5 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3" />
                  <span className="sr-only">
                    {t("qualifications.clearSearch")}
                  </span>
                </Button>
              ) : null}
            </div>
          ) : null}

          {count > 1 ? (
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
              {t("qualifications.courseSlideCounter", {
                current: formatNumber(current, locale),
                total: formatNumber(count, locale),
              })}
            </span>
          ) : null}

          <div className="flex items-center gap-1">
            <CarouselPrevious className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-xl border border-border/70 bg-card shadow-2xs hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
            <CarouselNext className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-xl border border-border/70 bg-card shadow-2xs hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {filteredCourses.length === 0 ? (
          <EmptyState isSearch onReset={() => setSearchQuery("")} />
        ) : (
          <CarouselContent className="-ms-3 items-stretch py-1">
            {filteredCourses.map((qualification, index) => (
              <CarouselItem
                key={qualification.id || qualification.courseId}
                className="shrink-0 basis-[85%] ps-3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <CourseCard
                  qualification={qualification}
                  index={index}
                  locale={locale}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        )}
      </div>
    </Carousel>
  )
}
