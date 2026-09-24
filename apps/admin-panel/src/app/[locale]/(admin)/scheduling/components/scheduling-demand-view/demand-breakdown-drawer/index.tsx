"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { Counter } from "@workspace/ui/components/counter"
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

export interface CourseAdjustment {
  suggestedClassCount?: number
  capacity?: number
}

export interface DemandBreakdownDrawerProps {
  courses: CourseDemandSummaryDto[]
  adjustments: Record<string, CourseAdjustment>
  onAdjustmentChange: (courseId: string, changes: CourseAdjustment) => void
  isLoading?: boolean
}

export function DemandBreakdownDrawer({
  courses,
  adjustments,
  onAdjustmentChange,
}: DemandBreakdownDrawerProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()

  if (!courses || courses.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* Desktop: Table view */}
      <div className="hidden w-full overflow-hidden rounded-2xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48">{t("course")}</TableHead>
              <TableHead className="min-w-60">{t("students")}</TableHead>
              <TableHead className="w-40 text-center">
                {t("suggestedClasses")}
              </TableHead>
              <TableHead className="w-36 text-center">
                {t("capacity")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((item) => {
              const currentClassCount =
                adjustments[item.courseId]?.suggestedClassCount ??
                item.suggestedClassCount
              const currentCapacity =
                adjustments[item.courseId]?.capacity ?? item.suggestedCapacity

              return (
                <TableRow key={item.courseId}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">
                        {item.courseTitle}
                      </span>
                      {item.prerequisiteTitle && (
                        <span className="text-xs text-muted-foreground">
                          {t("prerequisite", {
                            title: item.prerequisiteTitle,
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {t("studentsDetail", {
                        continuing: formatNumber(
                          item.continuingStudentsCount,
                          locale
                        ),
                        new: formatNumber(item.newPlacementCount, locale),
                        total: formatNumber(item.eligibleStudentsCount, locale),
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Counter
                        size="sm"
                        min={0}
                        max={50}
                        value={currentClassCount}
                        onValueChange={(val) => {
                          onAdjustmentChange(item.courseId, {
                            suggestedClassCount: val,
                          })
                        }}
                        className="w-32"
                        aria-label={`${t("suggestedClasses")} - ${item.courseTitle}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Counter
                        size="sm"
                        min={1}
                        max={100}
                        value={currentCapacity}
                        onValueChange={(val) => {
                          onAdjustmentChange(item.courseId, {
                            capacity: val,
                          })
                        }}
                        className="w-32"
                        aria-label={`${t("capacity")} - ${item.courseTitle}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards view */}
      <div className="flex flex-col gap-3 lg:hidden">
        {courses.map((item) => {
          const currentClassCount =
            adjustments[item.courseId]?.suggestedClassCount ??
            item.suggestedClassCount
          const currentCapacity =
            adjustments[item.courseId]?.capacity ?? item.suggestedCapacity

          return (
            <DemandBreakdownCard
              key={item.courseId}
              item={item}
              currentClassCount={currentClassCount}
              currentCapacity={currentCapacity}
              onAdjustmentChange={onAdjustmentChange}
            />
          )
        })}
      </div>
    </div>
  )
}
