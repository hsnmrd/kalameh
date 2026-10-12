"use client"

import * as React from "react"
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
  Dialog,
  DialogCloseButton,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SuggestedClassControl } from "../suggested-class-control"

export interface DemandClassesEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: CourseDemandSummaryDto | null
  suggestions: SuggestedClassDto[]
  capacityLimit: number
  onCapacityChange: (
    courseId: string,
    classKey: string,
    capacity: number
  ) => void
  onAddClass: (courseId: string) => void
  onRemoveClass: (courseId: string, classKey: string) => void
}

export function DemandClassesEditDialog({
  open,
  onOpenChange,
  course,
  suggestions,
  capacityLimit,
  onCapacityChange,
  onAddClass,
  onRemoveClass,
}: DemandClassesEditDialogProps) {
  const t = useTranslations("scheduling.demand.breakdown")
  const locale = useLocale()
  const isMobile = useIsMobile()

  // Retain the last active course so that during exit animation, the dialog/drawer
  // still has valid data to render and doesn't abruptly unmount
  const [cachedCourse, setCachedCourse] =
    React.useState<CourseDemandSummaryDto | null>(course)

  React.useEffect(() => {
    if (course) {
      setCachedCourse(course)
    }
  }, [course])

  const activeCourse = course ?? cachedCourse

  if (!activeCourse) return null

  const plannedSeats = suggestions.reduce(
    (total, suggestedClass) => total + suggestedClass.capacity,
    0
  )
  const uncovered = calculateUncoveredStudents(
    activeCourse.eligibleStudentsCount,
    suggestions.map((suggestedClass) => suggestedClass.capacity)
  )

  const bodyContent = (
    <>
      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
        <span>
          {t("plannedSeats", {
            count: formatNumber(plannedSeats, locale),
          })}
        </span>
        {uncovered > 0 ? (
          <Badge variant="destructive">
            {t("uncovered", { count: formatNumber(uncovered, locale) })}
          </Badge>
        ) : (
          <Badge variant="secondary">{t("covered")}</Badge>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {suggestions.map((suggestedClass, index) => (
          <SuggestedClassControl
            key={suggestedClass.key}
            item={suggestedClass}
            index={index}
            courseTitle={activeCourse.courseTitle}
            capacityLimit={capacityLimit}
            onCapacityChange={(capacity) =>
              onCapacityChange(
                activeCourse.courseId,
                suggestedClass.key,
                capacity
              )
            }
            onRemove={() =>
              onRemoveClass(activeCourse.courseId, suggestedClass.key)
            }
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => onAddClass(activeCourse.courseId)}
      >
        <Plus aria-hidden />
        {t("addClass")}
      </Button>
    </>
  )

  // Mobile: native bottom sheet Drawer with smooth slide-up animation
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-0">
          <DrawerHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <DrawerTitle className="text-base font-semibold">
                {t("editClassesTitle", { course: activeCourse.courseTitle })}
              </DrawerTitle>
              <Badge variant="outline">
                {t("classesCountSummary", {
                  count: formatNumber(suggestions.length, locale),
                })}
              </Badge>
            </div>
            <DrawerCloseButton />
          </DrawerHeader>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-4">
            {bodyContent}
          </div>

          <DrawerFooter className="border-t border-border/60 bg-muted/20 px-4 py-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {t("confirm")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: centered Dialog popup with smooth fade & scale animation
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold sm:text-lg">
              {t("editClassesTitle", { course: activeCourse.courseTitle })}
            </DialogTitle>
            <Badge variant="outline">
              {t("classesCountSummary", {
                count: formatNumber(suggestions.length, locale),
              })}
            </Badge>
          </div>
          <DialogCloseButton />
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {bodyContent}
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
