"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Pencil } from "lucide-react"
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
import { DemandClassesEditDialog } from "./demand-classes-edit-dialog"
import { StudentDemandBar } from "./student-demand-bar"

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
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(
    null
  )

  const activeCourse = React.useMemo(
    () =>
      courses.find((course) => course.courseId === editingCourseId) ??
      courses[0] ??
      null,
    [courses, editingCourseId]
  )

  if (courses.length === 0) return null

  return (
    <div className="w-full">
      {/* Desktop Table View */}
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

              return (
                <TableRow key={course.courseId}>
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
                    <StudentDemandBar
                      continuing={course.continuingStudentsCount}
                      newStudents={course.newPlacementCount}
                      total={course.eligibleStudentsCount}
                    />
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
                      <Badge variant="success">{t("covered")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-end align-middle">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${t("editClasses")} - ${course.courseTitle}`}
                      onClick={() => setEditingCourseId(course.courseId)}
                    >
                      <Pencil className="size-4" aria-hidden />
                      <span className="sr-only">{t("editClasses")}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="flex flex-col gap-3 lg:hidden">
        {courses.map((course) => (
          <DemandBreakdownCard
            key={course.courseId}
            item={course}
            suggestions={
              suggestions[course.courseId] ?? course.suggestedClasses
            }
            onEdit={() => setEditingCourseId(course.courseId)}
          />
        ))}
      </div>

      {/* Edit Classes Dialog (Bottom Sheet on mobile, Popup Dialog on desktop) */}
      <DemandClassesEditDialog
        open={editingCourseId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCourseId(null)
        }}
        course={activeCourse}
        suggestions={
          activeCourse
            ? (suggestions[activeCourse.courseId] ??
              activeCourse.suggestedClasses)
            : []
        }
        capacityLimit={capacityLimit}
        onCapacityChange={onCapacityChange}
        onAddClass={onAddClass}
        onRemoveClass={onRemoveClass}
      />
    </div>
  )
}
