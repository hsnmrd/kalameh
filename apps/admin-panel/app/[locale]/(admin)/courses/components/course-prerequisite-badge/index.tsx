"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GitCommit, Sparkles } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"

export interface CoursePrerequisiteBadgeProps {
  prerequisite?: { id: string; title: string } | null
}

export function CoursePrerequisiteBadge({
  prerequisite,
}: CoursePrerequisiteBadgeProps) {
  const t = useTranslations("courses.table")

  if (prerequisite) {
    return (
      <Badge
        variant="outline"
        className="border-sky-500/20 bg-sky-500/10 font-medium text-sky-600"
      >
        <GitCommit className="me-1 size-3.5" />
        <span>{prerequisite.title}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600"
    >
      <Sparkles className="me-1 size-3.5 text-emerald-600" />
      <span>{t("noPrerequisite")}</span>
    </Badge>
  )
}
