"use client"

import { useLocale, useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import {
  calculateUncoveredStudents,
  type CourseDemandSummaryDto,
  type SuggestedClassDto,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { formatNumber } from "@workspace/ui/lib/utils"
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

  if (courses.length === 0) return null

  return (
    <div className="w-full">
      <div className="hidden w-full overflow-hidden rounded-2xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">{t("course")}</TableHead>
              <TableHead className="min-w-60">{t("students")}</TableHead>
              <TableHead className="min-w-72">{t("classRows")}</TableHead>
              <TableHead className="w-36">{t("coverage")}</TableHead>
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

              return (
                <TableRow key={course.courseId}>
                  <TableCell className="align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {course.courseTitle}
                      </span>
                      {course.prerequisiteTitle && (
                        <span className="text-xs text-muted-foreground">
                          {t("prerequisite", {
                            title: course.prerequisiteTitle,
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
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
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {classes.map((suggestedClass, index) => (
                        <SuggestedClassControl
                          key={suggestedClass.key}
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
                            onRemoveClass(course.courseId, suggestedClass.key)
                          }
                        />
                      ))}
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {t("plannedSeats", {
                          count: formatNumber(planned, locale),
                        })}
                      </span>
                      {uncovered > 0 ? (
                        <Badge variant="destructive">
                          {t("uncovered", {
                            count: formatNumber(uncovered, locale),
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("covered")}</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
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
            onCapacityChange={onCapacityChange}
            onAddClass={onAddClass}
            onRemoveClass={onRemoveClass}
          />
        ))}
      </div>
    </div>
  )
}
