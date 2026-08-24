"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"

export interface UserStatusBadgeProps {
  isActive: boolean
}

export function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  const t = useTranslations("users.status")

  if (isActive) {
    return (
      <Badge variant="success">
        <span className="me-1.5 size-1.5 rounded-full bg-emerald-500" />
        {t("active")}
      </Badge>
    )
  }

  return (
    <Badge variant="destructive">
      <span className="me-1.5 size-1.5 rounded-full bg-rose-500" />
      {t("inactive")}
    </Badge>
  )
}
