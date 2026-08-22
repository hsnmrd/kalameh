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
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
          : "border-rose-500/30 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25"
      }
    >
      {isActive ? t("status.active") : t("status.inactive")}
    </Badge>
  )
}
