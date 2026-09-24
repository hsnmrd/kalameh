"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

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
  const [isOpen, setIsOpen] = React.useState(false)

  if (!courses || courses.length === 0) {
    return null
  }

  return (
    <div className="flex w-full flex-col items-center">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="flex w-full flex-col items-center"
      >
        <CollapsibleTrigger className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span>
            {t("toggle", { count: formatNumber(courses.length, locale) })}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
              isOpen && "rotate-180"
            )}
            aria-hidden
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 w-full">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
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
                    adjustments[item.courseId]?.capacity ??
                    item.suggestedCapacity

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
                            total: formatNumber(
                              item.eligibleStudentsCount,
                              locale
                            ),
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={currentClassCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              onAdjustmentChange(item.courseId, {
                                suggestedClassCount: isNaN(val)
                                  ? 1
                                  : Math.max(1, val),
                              })
                            }}
                            className="h-10 w-24 rounded-xl text-center text-sm font-semibold"
                            aria-label={`${t("suggestedClasses")} - ${item.courseTitle}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={currentCapacity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              onAdjustmentChange(item.courseId, {
                                capacity: isNaN(val) ? 1 : Math.max(1, val),
                              })
                            }}
                            className="h-10 w-24 rounded-xl text-center text-sm font-semibold"
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
