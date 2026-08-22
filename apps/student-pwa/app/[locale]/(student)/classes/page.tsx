"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Layers } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { classesResource } from "@/lib/api"
import { StudentLevelHeader } from "./components/student-level-header"
import { StudentClassCard } from "./components/student-class-card"

export default function StudentClassesPage() {
  const t = useTranslations("classes")
  const { data, isLoading } = useQuery(classesResource.available.toQuery())

  return (
    <div className="space-y-5 pb-8">
      <StudentLevelHeader allowedCourseTitle={data?.allowedCourseTitle} />

      {isLoading ? (
        <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner className="size-8 text-slate-600" />
        </div>
      ) : !data?.classes || data.classes.length === 0 ? (
        <div className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="size-6" />
          </div>
          <p className="text-xs font-medium text-slate-700">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.classes.map((cls) => (
            <StudentClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  )
}
