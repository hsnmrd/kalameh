"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Pencil, Plus, X } from "lucide-react"
import {
  calculateUncoveredStudents,
  type CourseDemandSummaryDto,
  type SuggestedClassDto,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { DemandBreakdownCard } from "./demand-breakdown-card"
import { SuggestedClassControl } from "./suggested-class-control"

export interface DemandBreakdownDrawerProps {
  courses: CourseDemandSummaryDto[]
  suggestions: Record<string, SuggestedClassDto[]>
  capacityLimit: number
  onCapacityChange: (
    courseId: string,
    classKey: string,
    capacity: number
  ) => void
  onAddClass: (courseId: string) => void
  onRemoveClass: (courseId: string, classKey: string) => void
}

export function DemandBreakdownDrawer({
  courses,
  suggestions,
  capacityLimit,
  onCapacityChange,
  onAddClass,
  onRemoveClass,
}: DemandBreakdownDrawerProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()
  const [expandedCourseIds, setExpandedCourseIds] = React.useState<
    Record<string, boolean>
  >({})

  const toggleCourseExpand = React.useCallback((courseId: string) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }))
  }, [])

  if (courses.length === 0) return null

  return (
    <div className="w-full">
      <div className="hidden w-full overflow-hidden rounded-2xl border border-border bg-card lg:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">{t("course")}</TableHead>
              <TableHead className="w-36">{t("prerequisiteColumn")}</TableHead>
              <TableHead>{t("students")}</TableHead>
              <TableHead className="w-28">{t("classesCountColumn")}</TableHead>
              <TableHead className="w-44">{t("coverage")}</TableHead>
              <TableHead className="w-36">{t("statusColumn")}</TableHead>
              <TableHead className="w-14 text-end">
                <span className="sr-only">{t("editClasses")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => {
              const classes =
                suggestions[course.courseId] ?? course.suggestedClasses
              const planned = classes.reduce(
                (total, suggestedClass) => total + suggestedClass.capacity,
                0
              )
              const uncovered = calculateUncoveredStudents(
                course.eligibleStudentsCount,
                classes.map((item) => item.capacity)
              )
              const isExpanded = Boolean(expandedCourseIds[course.courseId])
              const toggleActionLabel = isExpanded
                ? t("closeClasses")
                : t("editClasses")

              return (
                <React.Fragment key={course.courseId}>
                  <TableRow
                    className={cn(
                      isExpanded && "border-b-0 bg-muted/20 hover:bg-muted/20"
                    )}
                  >
                    <TableCell className="align-middle">
                      <span className="font-semibold text-foreground">
                        {course.courseTitle}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      <span className="text-sm text-muted-foreground">
                        {course.prerequisiteTitle ?? t("noPrerequisite")}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      <span className="text-sm text-muted-foreground">
                        {t("studentsDetail", {
                          continuing: formatNumber(
                            course.continuingStudentsCount,
                            locale
                          ),
                          new: formatNumber(course.newPlacementCount, locale),
                          total: formatNumber(
                            course.eligibleStudentsCount,
                            locale
                          ),
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge variant="outline">
                        {t("classesCountSummary", {
                          count: formatNumber(classes.length, locale),
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle">
                      <span className="text-sm font-semibold text-foreground">
                        {t("plannedSeats", {
                          count: formatNumber(planned, locale),
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="align-middle">
                      {uncovered > 0 ? (
                        <Badge variant="destructive">
                          {t("uncovered", {
                            count: formatNumber(uncovered, locale),
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("covered")}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end align-middle">
                      <Button
                        type="button"
                        variant={isExpanded ? "secondary" : "ghost"}
                        size="icon-sm"
                        aria-expanded={isExpanded}
                        aria-label={`${toggleActionLabel} - ${course.courseTitle}`}
                        onClick={() => toggleCourseExpand(course.courseId)}
                      >
                        {isExpanded ? (
                          <X aria-hidden />
                        ) : (
                          <Pencil aria-hidden />
                        )}
                        <span className="sr-only">{toggleActionLabel}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="border-t-0 bg-muted/20 hover:bg-muted/20">
                      <TableCell
                        colSpan={7}
                        className="w-full max-w-0 pt-0 pb-4"
                      >
                        <Carousel
                          opts={{
                            align: "start",
                            containScroll: "trimSnaps",
                            dragFree: true,
                            direction: locale === "fa" ? "rtl" : "ltr",
                          }}
                          className="w-full"
                        >
                          <CarouselContent className="items-center">
                            {classes.map((suggestedClass, index) => (
                              <CarouselItem
                                key={suggestedClass.key}
                                className="basis-auto"
                              >
                                <SuggestedClassControl
                                  item={suggestedClass}
                                  index={index}
                                  courseTitle={course.courseTitle}
                                  capacityLimit={capacityLimit}
                                  compact
                                  onCapacityChange={(capacity) =>
                                    onCapacityChange(
                                      course.courseId,
                                      suggestedClass.key,
                                      capacity
                                    )
                                  }
                                  onRemove={() =>
                                    onRemoveClass(
                                      course.courseId,
                                      suggestedClass.key
                                    )
                                  }
                                />
                              </CarouselItem>
                            ))}
                            <CarouselItem className="basis-auto">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-fit"
                                onClick={() => onAddClass(course.courseId)}
                              >
                                <Plus aria-hidden />
                                {t("addClass")}
                              </Button>
                            </CarouselItem>
                          </CarouselContent>
                          <div className="mt-2.5 flex items-center justify-end gap-1.5">
                            <CarouselPrevious
                              type="button"
                              className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                            />
                            <CarouselNext
                              type="button"
                              className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                            />
                          </div>
                        </Carousel>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {courses.map((course) => (
          <DemandBreakdownCard
            key={course.courseId}
            item={course}
            suggestions={
              suggestions[course.courseId] ?? course.suggestedClasses
            }
            capacityLimit={capacityLimit}
            isExpanded={Boolean(expandedCourseIds[course.courseId])}
            onToggleExpand={() => toggleCourseExpand(course.courseId)}
            onCapacityChange={onCapacityChange}
            onAddClass={onAddClass}
            onRemoveClass={onRemoveClass}
          />
        ))}
      </div>
    </div>
  )
}
