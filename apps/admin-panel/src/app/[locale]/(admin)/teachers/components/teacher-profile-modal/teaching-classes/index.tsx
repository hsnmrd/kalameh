"use client"

import { useTranslations } from "next-intl"
import { BookOpen } from "lucide-react"
import type { TeacherDto } from "@workspace/types"

export function TeachingClasses({ teacher }: { teacher: TeacherDto }) {
  const t = useTranslations("teachers")
  const classes = teacher.teachingClasses || []
  return (
    <div className="flex flex-col gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BookOpen className="size-4 text-muted-foreground" />
        <span>{t("profileModal.classesTaught")}</span>
      </h4>
      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          {t("profileModal.noClasses")}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {classes.map((classroom) => (
            <div
              key={classroom.id}
              className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {classroom.title}
                </p>
                {classroom.term && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {classroom.term.title}
                  </p>
                )}
              </div>
              {classroom.schedule && (
                <span className="text-[11px] text-muted-foreground">
                  {classroom.schedule}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
