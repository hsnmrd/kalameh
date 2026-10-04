"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, ChevronDown, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ClassRequirementDto } from "@workspace/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { studentsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface SchedulingStudentScheduleWarningProps {
  requirements: ClassRequirementDto[]
  selectedRequirementIds: string[]
}

export function SchedulingStudentScheduleWarning({
  requirements,
  selectedRequirementIds,
}: SchedulingStudentScheduleWarningProps) {
  const { activeInstituteId } = useActiveInstitute()
  const [isOpen, setIsOpen] = React.useState(false)
  const t = useTranslations("scheduling.generation.studentScheduleWarning")
  const locale = useLocale()

  const studentsQuery = useQuery({
    ...studentsResource.list.toQuery(
      activeInstituteId
        ? { instituteId: activeInstituteId, isActive: true }
        : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const selectedCourseIds = React.useMemo(() => {
    const idSet = new Set(selectedRequirementIds)
    return new Set(
      requirements.filter((r) => idSet.has(r.id)).map((r) => r.courseId)
    )
  }, [requirements, selectedRequirementIds])

  const incompleteStudents = React.useMemo(() => {
    if (!studentsQuery.data || selectedCourseIds.size === 0) return []
    return studentsQuery.data.filter(
      (student) =>
        student.currentAllowedCourseId &&
        selectedCourseIds.has(student.currentAllowedCourseId) &&
        student.studentProfile?.scheduleStatus === "INCOMPLETE"
    )
  }, [studentsQuery.data, selectedCourseIds])

  if (incompleteStudents.length === 0) {
    return null
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="overflow-hidden rounded-2xl border border-warning/30 bg-warning/5 p-3.5 text-foreground sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-warning" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              {t("title", {
                count: formatNumber(incompleteStudents.length, locale),
              })}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <CollapsibleTrigger
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/20"
        >
          <span>{isOpen ? t("hideNames") : t("viewNames")}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="mt-3 border-t border-warning/20 pt-3">
          <div className="max-h-36 space-y-1.5 overflow-y-auto overscroll-contain pe-1">
            {incompleteStudents.map((student) => {
              const fullName = `${student.firstName} ${student.lastName}`
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {fullName}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {student.phone}
                    </span>
                    {student.currentAllowedCourse && (
                      <span className="text-[11px] text-muted-foreground">
                        • {student.currentAllowedCourse.title}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="h-4.5 border-warning/30 bg-warning/10 px-1.5 text-[10px] text-warning"
                  >
                    <Clock className="me-1 size-2.5 text-inherit" />
                    {t("needsCall")}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
