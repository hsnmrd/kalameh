"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"

export interface TermStatusBadgeProps {
  isActive: boolean
}

export function TermStatusBadge({ isActive }: TermStatusBadgeProps) {
  const t = useTranslations("terms.status")

  if (isActive) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        <span className="me-1.5 size-1.5 rounded-full bg-emerald-500" />
        {t("active")}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-slate-200 bg-slate-50 text-slate-600"
    >
      <span className="me-1.5 size-1.5 rounded-full bg-slate-400" />
      {t("inactive")}
    </Badge>
  )
}
