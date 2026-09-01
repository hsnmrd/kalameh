"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"

export interface ClassroomStatusBadgeProps {
  isActive: boolean
}

export function ClassroomStatusBadge({ isActive }: ClassroomStatusBadgeProps) {
  const t = useTranslations("classrooms.status")

  if (isActive) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-600"
      >
        <span className="me-1.5 size-1.5 rounded-full bg-emerald-500" />
        {t("active")}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-muted-foreground/30 bg-muted font-medium text-muted-foreground"
    >
      <span className="me-1.5 size-1.5 rounded-full bg-muted-foreground" />
      {t("inactive")}
    </Badge>
  )
}
