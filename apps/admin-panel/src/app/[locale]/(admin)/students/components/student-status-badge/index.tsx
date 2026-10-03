"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"

export interface StudentStatusBadgeProps {
  isActive: boolean
}

export function StudentStatusBadge({ isActive }: StudentStatusBadgeProps) {
  const t = useTranslations("students")

  return (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={
        isActive
          ? "border-success/30 bg-success/15 text-success hover:bg-success/25"
          : "border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25"
      }
    >
      {isActive ? t("status.active") : t("status.inactive")}
    </Badge>
  )
}
