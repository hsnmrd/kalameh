"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { ROLES, type Role } from "@workspace/types"

export interface UserRoleBadgeProps {
  role: Role
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const t = useTranslations("users.roles")

  switch (role) {
    case ROLES.SUPER_ADMIN:
      return (
        <Badge
          variant="outline"
          className="border-purple-500/30 bg-purple-500/10 text-purple-600"
        >
          {t("SUPER_ADMIN")}
        </Badge>
      )
    case ROLES.INSTITUTE_ADMIN:
      return <Badge variant="default">{t("INSTITUTE_ADMIN")}</Badge>
    case ROLES.CLERK:
      return <Badge variant="info">{t("CLERK")}</Badge>
    case ROLES.STUDENT:
    default:
      return <Badge variant="secondary">{t("STUDENT")}</Badge>
  }
}
