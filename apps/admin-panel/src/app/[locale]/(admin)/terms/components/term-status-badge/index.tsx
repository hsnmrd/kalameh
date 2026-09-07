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
        className="border-success/20 bg-success/10 text-success"
      >
        <span className="me-1.5 size-1.5 rounded-full bg-success" />
        {t("active")}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-border bg-muted text-muted-foreground"
    >
      <span className="me-1.5 size-1.5 rounded-full bg-muted-foreground" />
      {t("inactive")}
    </Badge>
  )
}
