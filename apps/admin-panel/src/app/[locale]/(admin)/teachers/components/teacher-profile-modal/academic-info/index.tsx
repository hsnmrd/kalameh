"use client"

import { useTranslations } from "next-intl"
import { GraduationCap } from "lucide-react"
import type { TeacherDto } from "@workspace/types"

export function AcademicInfo({ teacher }: { teacher: TeacherDto }) {
  const t = useTranslations("teachers")
  return (
    <div className="flex flex-col gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <GraduationCap className="size-4 text-muted-foreground" />
        <span>{t("profileModal.academicInfo")}</span>
      </h4>
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 text-xs">
        <div>
          <span className="mb-1 block text-muted-foreground">
            {t("createModal.degree")}:
          </span>
          <p className="font-medium text-foreground">
            {teacher.teacherProfile?.degree || "—"}
          </p>
        </div>
        {teacher.teacherProfile?.bio && (
          <div>
            <span className="mb-1 block text-muted-foreground">
              {t("createModal.bio")}:
            </span>
            <p className="leading-relaxed whitespace-pre-wrap text-foreground">
              {teacher.teacherProfile.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
