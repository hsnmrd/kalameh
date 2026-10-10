"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GraduationCap, Building2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import type { StudentDto } from "@workspace/types"
import { StudentScheduleStatusBadge } from "../../student-schedule-status-badge"

export interface StudentAcademicInfoProps {
  student: StudentDto
  formattedCreatedDate: string
}

export function StudentAcademicInfo({
  student,
  formattedCreatedDate,
}: StudentAcademicInfoProps) {
  const t = useTranslations("students")

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-xs text-muted-foreground">
          {t("table.currentLevel")}
        </span>
        <div className="pt-1">
          {student.currentAllowedCourse ? (
            <Badge variant="outline" className="gap-1 text-xs text-primary">
              <GraduationCap className="size-3" />
              <span>{student.currentAllowedCourse.title}</span>
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("table.noLevel")}
            </span>
          )}
        </div>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          {t("actions.availability")}
        </span>
        <div className="pt-1">
          <StudentScheduleStatusBadge
            scheduleStatus={student.studentProfile?.scheduleStatus}
          />
        </div>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          {t("table.branch")}
        </span>
        <div className="pt-1">
          {student.branch ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <Building2 className="size-3" />
              <span>{student.branch.name}</span>
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          {t("table.createdAt")}
        </span>
        <p className="font-medium text-foreground">{formattedCreatedDate}</p>
      </div>
    </div>
  )
}
