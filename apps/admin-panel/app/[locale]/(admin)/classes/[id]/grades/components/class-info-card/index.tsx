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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Layers className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-slate-500">{t("title")}</span>
            <span className="text-sm font-semibold text-slate-900">
              {cls.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <BookOpen className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-slate-500">{t("course")}</span>
            <span className="text-sm font-semibold text-slate-900">
              {cls.course?.title || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Calendar className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-slate-500">{t("term")}</span>
            <span className="text-sm font-semibold text-slate-900">
              {cls.term?.title || "-"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Users className="size-4" />
          </div>
          <div>
            <span className="block text-xs text-slate-500">
              {t("studentsCount")}
            </span>
            <span className="font-mono text-sm font-semibold text-slate-900">
              {studentsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
