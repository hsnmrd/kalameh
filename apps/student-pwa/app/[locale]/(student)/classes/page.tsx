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
        <div className="flex h-56 w-full items-center justify-center rounded-2xl border border-border bg-card">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : !data?.classes || data.classes.length === 0 ? (
        <div className="flex h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Layers className="size-6" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("empty")}
          </p>
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
