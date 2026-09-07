"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Layers, BookOpen, Calendar, Users } from "lucide-react"
import type { ClassDto } from "@workspace/types"

export interface ClassInfoCardProps {
  cls: ClassDto | undefined
  studentsCount: number
}

export function ClassInfoCard({ cls, studentsCount }: ClassInfoCardProps) {
  const t = useTranslations("grades.classInfo")

  if (!cls) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
            <Layers className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              {t("title")}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {cls.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              {t("course")}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {cls.course?.title || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <Calendar className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              {t("term")}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {cls.term?.title || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Users className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              {t("studentsCount")}
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {studentsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
