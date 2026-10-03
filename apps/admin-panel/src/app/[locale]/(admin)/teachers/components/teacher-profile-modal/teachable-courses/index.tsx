"use client"

import { useTranslations } from "next-intl"
import { BookOpenCheck } from "lucide-react"
import type { TeacherCourseQualification } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"

interface TeachableCoursesProps {
  qualifications: TeacherCourseQualification[]
}

export function TeachableCourses({ qualifications }: TeachableCoursesProps) {
  const t = useTranslations("teachers.qualifications")

  return (
    <section className="flex flex-col gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BookOpenCheck className="size-4 text-foreground" />
        <span>{t("profileTitle")}</span>
      </h4>
      {qualifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("profileEmpty")}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-card p-4">
          {qualifications.map((qualification) => (
            <Badge key={qualification.id} variant="secondary">
              {qualification.course?.title ?? qualification.courseId}
            </Badge>
          ))}
        </div>
      )}
    </section>
  )
}
