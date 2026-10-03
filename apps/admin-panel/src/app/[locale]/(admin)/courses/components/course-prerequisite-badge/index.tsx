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
        className="border-primary/20 bg-primary/10 font-medium text-primary"
      >
        <GitCommit className="me-1 size-3.5" />
        <span>{prerequisite.title}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-success/20 bg-success/10 font-medium text-success"
    >
      <Sparkles className="me-1 size-3.5 text-success" />
      <span>{t("noPrerequisite")}</span>
    </Badge>
  )
}
